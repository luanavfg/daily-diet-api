import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { knex } from '../database'
import { randomUUID } from 'node:crypto'

export async function usersRoutes(app: FastifyInstance) {
  app.post('/', async (request, reply) => {
    const createUserBodySchema = z.object({
      name: z.string(),
      email: z.string(),
    })

    let sessionId = request.cookies.sessionId

    if (!sessionId) {
      sessionId = randomUUID()

      reply.cookie('sessionId', sessionId, {
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      })
    }

    const { name, email } = createUserBodySchema.parse(request.body)

    await knex('users').insert({
      id: randomUUID(),
      name,
      email,
      session_id: sessionId,
    })

    return reply.status(201).send()
  })

  app.get('/', async () => {
    const users = await knex('users').select()

    return { users }
  })

  app.get('/:id', async (request) => {
    const getUserBodySchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = getUserBodySchema.parse(request.params)
    const user = await knex('users').where('id', id).first()

    return { user }
  })

  app.delete('/:id', async (request, reply) => {
    const getUserBodySchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = getUserBodySchema.parse(request.params)
    await knex('users').where('id', id).del()

    return reply.status(200).send({
      message: 'User successfully deleted',
    })
  })
}
