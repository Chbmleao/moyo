import type { Patient } from "../../domain/entities/patient.js";
import type { PatientRepository } from "../../domain/repositories/patient-repository.js";

export type ListPatients = (professionalId: string) => Promise<Patient[]>;

export function makeListPatients(patientRepository: PatientRepository): ListPatients {
	return async function listPatients(professionalId: string): Promise<Patient[]> {
		return patientRepository.findAllByProfessional(professionalId);
	};
}
