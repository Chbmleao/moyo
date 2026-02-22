export type Patient = {
	id: string;
	professionalId: string;
	name: string;
	email: string | null;
	avatarUrl: string | null;
	linkedUserId: string | null;
	createdAt: Date;
	updatedAt: Date;
};
