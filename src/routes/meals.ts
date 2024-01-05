import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { knex } from '../database'
import { randomUUID } from 'node:crypto'

export async function mealsRoutes(app: FastifyInstance) {
  app.get('/', async () => {
    const meals = await knex('meals').select()

    return { meals }
  })

  app.get('/:id', async (request) => {
    const getMealBodySchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = getMealBodySchema.parse(request.params)
    const meal = await knex('meals').where('id', id).first()

    return { meal }
  })

  app.delete('/:id', async (request, reply) => {
    const getMealBodySchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = getMealBodySchema.parse(request.params)
    await knex('meals').where('id', id).del()

    return reply.status(200).send({
      message: 'Meal successfully deleted',
    })
  })

  app.post('/', async (request, reply) => {
    const createMealBodySchema = z.object({
      name: z.string(),
      description: z.string(),
      isOnDiet: z.boolean(),
    })

    const { name, description, isOnDiet } = createMealBodySchema.parse(
      request.body,
    )

    await knex('meals').insert({
      id: randomUUID(),
      name,
      description,
      is_on_diet: isOnDiet,
    })

    return reply.status(201).send()
  })
}
