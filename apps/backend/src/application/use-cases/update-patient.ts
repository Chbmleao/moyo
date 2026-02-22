import type { Patient } from "../../domain/entities/patient.js";
import type { PatientRepository } from "../../domain/repositories/patient-repository.js";

export type UpdatePatientInput = {
	patientId: string;
	professionalId: string;
	name?: string;
	email?: string | null;
	avatarUrl?: string | null;
};

export type UpdatePatient = (input: UpdatePatientInput) => Promise<Patient>;

export function makeUpdatePatient(patientRepository: PatientRepository): UpdatePatient {
	return async function updatePatient(input: UpdatePatientInput): Promise<Patient> {
		const existing = await patientRepository.findById(input.patientId);
		if (!existing) {
			throw Object.assign(new Error("Patient not found"), { statusCode: 404 });
		}
		if (existing.professionalId !== input.professionalId) {
			throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
		}

		const name = input.name?.trim();
		if (name !== undefined && !name) {
			throw Object.assign(new Error("Name cannot be empty"), { statusCode: 400 });
		}

		const email = input.email !== undefined ? (input.email?.trim() || null) : undefined;

		// Re-check linked user if email changed
		let linkedUserId: string | null | undefined = undefined;
		if (email !== undefined && email !== existing.email) {
			if (email) {
				const linkedUser = await patientRepository.findLinkedUserByEmail(email);
				linkedUserId = linkedUser?.id ?? null;
			} else {
				linkedUserId = null;
			}
		}

		const updated = await patientRepository.update(input.patientId, {
			name,
			email,
			avatarUrl: input.avatarUrl,
			linkedUserId,
		});

		if (!updated) {
			throw Object.assign(new Error("Patient not found"), { statusCode: 404 });
		}

		return updated;
	};
}
