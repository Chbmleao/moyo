import type { Patient } from "../entities/patient.js";

export type CreatePatientInput = {
	professionalId: string;
	name: string;
	email: string | null;
	avatarUrl: string | null;
	linkedUserId: string | null;
};

export type UpdatePatientInput = {
	name?: string;
	email?: string | null;
	avatarUrl?: string | null;
	linkedUserId?: string | null;
};

export type PatientRepository = {
	create(input: CreatePatientInput): Promise<Patient>;
	findAllByProfessional(professionalId: string): Promise<Patient[]>;
	findById(id: string): Promise<Patient | null>;
	update(id: string, input: UpdatePatientInput): Promise<Patient | null>;
	delete(id: string): Promise<boolean>;
	findLinkedUserByEmail(email: string): Promise<{ id: string } | null>;
};
