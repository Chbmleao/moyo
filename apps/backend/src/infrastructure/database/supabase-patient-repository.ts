import { createClient } from "@supabase/supabase-js";
import type { Patient } from "../../domain/entities/patient.js";
import type {
	PatientRepository,
	CreatePatientInput,
	UpdatePatientInput,
} from "../../domain/repositories/patient-repository.js";

type PatientRow = {
	id: string;
	professional_id: string;
	name: string;
	email: string | null;
	avatar_url: string | null;
	linked_user_id: string | null;
	created_at: string;
	updated_at: string;
};

function rowToPatient(row: PatientRow): Patient {
	return {
		id: row.id,
		professionalId: row.professional_id,
		name: row.name,
		email: row.email,
		avatarUrl: row.avatar_url,
		linkedUserId: row.linked_user_id,
		createdAt: new Date(row.created_at),
		updatedAt: new Date(row.updated_at),
	};
}

export function createSupabasePatientRepository(): PatientRepository {
	const url = process.env.SUPABASE_URL;
	const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

	if (!url || !serviceRoleKey) {
		throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
	}

	const supabase = createClient(url, serviceRoleKey);

	return {
		async create(input: CreatePatientInput): Promise<Patient> {
			const { data, error } = await supabase
				.from("patients")
				.insert({
					professional_id: input.professionalId,
					name: input.name,
					email: input.email,
					avatar_url: input.avatarUrl,
					linked_user_id: input.linkedUserId,
				})
				.select()
				.single();

			if (error) throw error;
			return rowToPatient(data as PatientRow);
		},

		async findAllByProfessional(professionalId: string): Promise<Patient[]> {
			const { data, error } = await supabase
				.from("patients")
				.select("*")
				.eq("professional_id", professionalId)
				.order("name", { ascending: true });

			if (error) throw error;
			return (data as PatientRow[]).map(rowToPatient);
		},

		async findById(id: string): Promise<Patient | null> {
			const { data, error } = await supabase.from("patients").select("*").eq("id", id).single();

			if (error) {
				if (error.code === "PGRST116") return null;
				throw error;
			}
			return data ? rowToPatient(data as PatientRow) : null;
		},

		async update(id: string, input: UpdatePatientInput): Promise<Patient | null> {
			const updates: Record<string, unknown> = {};
			if (input.name !== undefined) updates.name = input.name;
			if (input.email !== undefined) updates.email = input.email;
			if (input.avatarUrl !== undefined) updates.avatar_url = input.avatarUrl;
			if (input.linkedUserId !== undefined) updates.linked_user_id = input.linkedUserId;

			if (Object.keys(updates).length === 0) {
				return this.findById(id);
			}

			const { data, error } = await supabase.from("patients").update(updates).eq("id", id).select().single();

			if (error) {
				if (error.code === "PGRST116") return null;
				throw error;
			}
			return data ? rowToPatient(data as PatientRow) : null;
		},

		async delete(id: string): Promise<boolean> {
			const { error, count } = await supabase.from("patients").delete({ count: "exact" }).eq("id", id);

			if (error) throw error;
			return (count ?? 0) > 0;
		},

		async findLinkedUserByEmail(email: string): Promise<{ id: string } | null> {
			// Use Supabase admin API to look up a user by email
			const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1 });
			if (error) return null;

			// The listUsers API doesn't support email filter directly, so we use
			// a direct query on auth.users via RPC or a different approach.
			// Since we have service_role, we can query the users table.
			// However, supabase-js admin API doesn't easily filter by email.
			// Let's use a workaround: search users by email via the admin API.
			// Actually, supabase admin has getUserByEmail in newer versions,
			// but let's use a reliable approach with the REST API.

			// Use the admin listUsers and filter — for small user bases this is fine.
			// For production, you'd want a database function or RPC.
			let page = 1;
			const perPage = 50;
			while (true) {
				const { data: usersData, error: listError } = await supabase.auth.admin.listUsers({
					page,
					perPage,
				});
				if (listError || !usersData?.users?.length) return null;

				const match = usersData.users.find(
					u => u.email?.toLowerCase() === email.toLowerCase() && u.user_metadata?.role === "patient",
				);
				if (match) return { id: match.id };

				if (usersData.users.length < perPage) break;
				page++;
			}

			return null;
		},
	};
}
