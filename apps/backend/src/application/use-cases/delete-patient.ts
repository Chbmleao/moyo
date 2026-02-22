import type { PatientRepository } from "../../domain/repositories/patient-repository.js";

export type DeletePatient = (patientId: string, professionalId: string) => Promise<void>;

export function makeDeletePatient(patientRepository: PatientRepository): DeletePatient {
	return async function deletePatient(patientId: string, professionalId: string): Promise<void> {
		const existing = await patientRepository.findById(patientId);
		if (!existing) {
			throw Object.assign(new Error("Patient not found"), { statusCode: 404 });
		}
		if (existing.professionalId !== professionalId) {
			throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
		}

		await patientRepository.delete(patientId);
	};
}
