import type { FastifyInstance } from "fastify";
import type { CreatePatient } from "../../../application/use-cases/create-patient.js";
import type { ListPatients } from "../../../application/use-cases/list-patients.js";
import type { UpdatePatient } from "../../../application/use-cases/update-patient.js";
import type { DeletePatient } from "../../../application/use-cases/delete-patient.js";

export function registerPatientRoutes(
	app: FastifyInstance,
	deps: {
		createPatient: CreatePatient;
		listPatients: ListPatients;
		updatePatient: UpdatePatient;
		deletePatient: DeletePatient;
	},
): void {
	// ── List patients ─────────────────────────────────────────────
	app.get("/patients", async (request, reply) => {
		if (!request.user) {
			await reply.status(401).send({ error: "Unauthorized" });
			return;
		}
		if (request.user.role !== "professional") {
			await reply.status(403).send({ error: "Forbidden", message: "Only professionals can manage patients" });
			return;
		}

		try {
			const patients = await deps.listPatients(request.user.id);
			await reply.send(
				patients.map(p => ({
					id: p.id,
					name: p.name,
					email: p.email,
					avatarUrl: p.avatarUrl,
					linkedUserId: p.linkedUserId,
					createdAt: p.createdAt.toISOString(),
					updatedAt: p.updatedAt.toISOString(),
				})),
			);
		} catch (err) {
			request.log.error(err);
			await reply.status(500).send({ error: "Internal Server Error" });
		}
	});

	// ── Create patient ────────────────────────────────────────────
	app.post("/patients", async (request, reply) => {
		if (!request.user) {
			await reply.status(401).send({ error: "Unauthorized" });
			return;
		}
		if (request.user.role !== "professional") {
			await reply.status(403).send({ error: "Forbidden", message: "Only professionals can manage patients" });
			return;
		}

		const body = request.body as { name?: string; email?: string; avatarUrl?: string } | null;
		if (!body?.name?.trim()) {
			await reply.status(400).send({ error: "Bad Request", message: "Name is required" });
			return;
		}

		try {
			const patient = await deps.createPatient({
				professionalId: request.user.id,
				name: body.name,
				email: body.email ?? null,
				avatarUrl: body.avatarUrl ?? null,
			});
			await reply.status(201).send({
				id: patient.id,
				name: patient.name,
				email: patient.email,
				avatarUrl: patient.avatarUrl,
				linkedUserId: patient.linkedUserId,
				createdAt: patient.createdAt.toISOString(),
				updatedAt: patient.updatedAt.toISOString(),
			});
		} catch (err) {
			const statusCode = (err as { statusCode?: number }).statusCode;
			if (statusCode) {
				await reply.status(statusCode).send({ error: (err as Error).message });
				return;
			}
			// Handle unique constraint violation (duplicate email for this professional)
			if ((err as { code?: string }).code === "23505") {
				await reply.status(409).send({ error: "Conflict", message: "A patient with this email already exists" });
				return;
			}
			request.log.error(err);
			await reply.status(500).send({ error: "Internal Server Error" });
		}
	});

	// ── Update patient ────────────────────────────────────────────
	app.put("/patients/:id", async (request, reply) => {
		if (!request.user) {
			await reply.status(401).send({ error: "Unauthorized" });
			return;
		}
		if (request.user.role !== "professional") {
			await reply.status(403).send({ error: "Forbidden", message: "Only professionals can manage patients" });
			return;
		}

		const { id } = request.params as { id: string };
		const body = request.body as { name?: string; email?: string | null; avatarUrl?: string | null } | null;

		try {
			const patient = await deps.updatePatient({
				patientId: id,
				professionalId: request.user.id,
				name: body?.name,
				email: body?.email,
				avatarUrl: body?.avatarUrl,
			});
			await reply.send({
				id: patient.id,
				name: patient.name,
				email: patient.email,
				avatarUrl: patient.avatarUrl,
				linkedUserId: patient.linkedUserId,
				createdAt: patient.createdAt.toISOString(),
				updatedAt: patient.updatedAt.toISOString(),
			});
		} catch (err) {
			const statusCode = (err as { statusCode?: number }).statusCode;
			if (statusCode) {
				await reply.status(statusCode).send({ error: (err as Error).message });
				return;
			}
			if ((err as { code?: string }).code === "23505") {
				await reply.status(409).send({ error: "Conflict", message: "A patient with this email already exists" });
				return;
			}
			request.log.error(err);
			await reply.status(500).send({ error: "Internal Server Error" });
		}
	});

	// ── Delete patient ────────────────────────────────────────────
	app.delete("/patients/:id", async (request, reply) => {
		if (!request.user) {
			await reply.status(401).send({ error: "Unauthorized" });
			return;
		}
		if (request.user.role !== "professional") {
			await reply.status(403).send({ error: "Forbidden", message: "Only professionals can manage patients" });
			return;
		}

		const { id } = request.params as { id: string };

		try {
			await deps.deletePatient(id, request.user.id);
			await reply.status(204).send();
		} catch (err) {
			const statusCode = (err as { statusCode?: number }).statusCode;
			if (statusCode) {
				await reply.status(statusCode).send({ error: (err as Error).message });
				return;
			}
			request.log.error(err);
			await reply.status(500).send({ error: "Internal Server Error" });
		}
	});
}
