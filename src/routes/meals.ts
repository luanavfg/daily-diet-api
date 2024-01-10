import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { knex } from '../database'
import { randomUUID } from 'node:crypto'
import { checkSessionIdExists } from '../middlewares/check-session-id-exists'

export async function mealsRoutes(app: FastifyInstance) {
  app.post(
    '/',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
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
        user_id: request.user?.id,
      })

      return reply.status(201).send()
    },
  )

  app.get(
    '/',
    {
      preHandler: [checkSessionIdExists],
    },
    async () => {
      const meals = await knex('meals').select()

      return { meals }
    },
  )

  app.get(
    '/:mealId',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
      const getMealBodySchema = z.object({
        mealId: z.string().uuid(),
      })

      const { mealId } = getMealBodySchema.parse(request.params)
      const meal = await knex('meals').where('id', mealId).first()

      if (!meal) {
        return reply.status(404).send({ error: 'Meal not found' })
      }

      return { meal }
    },
  )

  app.put(
    '/:mealId',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
      const updateMealBodySchema = z.object({
        mealId: z.string().uuid(),
        name: z.string().optional(),
        description: z.string().optional(),
        isOnDiet: z.boolean().optional(),
        updatedAt: z.coerce.date(),
      })

      const { name, description, isOnDiet, mealId, updatedAt } =
        updateMealBodySchema.parse(request.params)

      const meal = await knex('meals').where('id', mealId).first()

      if (!meal) {
        return reply.status(404).send({ error: 'Meal not found' })
      }

      await knex('meals').where('id', mealId).update({
        name,
        description,
        is_on_diet: isOnDiet,
        updated_at: updatedAt.toISOString(),
      })

      return reply.status(204).send({
        message: 'Meal successfully updated',
      })
    },
  )

  app.delete('/:mealId', async (request, reply) => {
    const deleteMealBodySchema = z.object({
      mealId: z.string().uuid(),
    })

    const { mealId } = deleteMealBodySchema.parse(request.params)
    const meal = await knex('meals').where('id', mealId).first()

    if (!meal) {
      return reply.status(404).send({ error: 'Meal not found' })
    }
    await knex('meals').where('id', mealId).del()

    return reply.status(200).send({
      message: 'Meal successfully deleted',
    })
  })
}
