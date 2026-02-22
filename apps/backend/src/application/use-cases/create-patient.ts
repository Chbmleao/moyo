import type { Patient } from "../../domain/entities/patient.js";
import type { PatientRepository } from "../../domain/repositories/patient-repository.js";

export type CreatePatientInput = {
	professionalId: string;
	name: string;
	email?: string | null;
	avatarUrl?: string | null;
};

export type CreatePatient = (input: CreatePatientInput) => Promise<Patient>;

export function makeCreatePatient(patientRepository: PatientRepository): CreatePatient {
	return async function createPatient(input: CreatePatientInput): Promise<Patient> {
		const email = input.email?.trim() || null;
		const name = input.name.trim();

		if (!name) {
			throw Object.assign(new Error("Name is required"), { statusCode: 400 });
		}

		// Auto-link to existing user account if email matches a patient
		let linkedUserId: string | null = null;
		if (email) {
			const linkedUser = await patientRepository.findLinkedUserByEmail(email);
			if (linkedUser) {
				linkedUserId = linkedUser.id;
			}
		}

		return patientRepository.create({
			professionalId: input.professionalId,
			name,
			email,
			avatarUrl: input.avatarUrl ?? null,
			linkedUserId,
		});
	};
}
