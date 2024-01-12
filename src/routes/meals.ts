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

      return reply.status(200).send()
    },
  )

  app.get(
    '/',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request) => {
      const meals = await knex('meals').where({ user_id: request.user?.id })
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
      const meal = await knex('meals')
        .where('id', mealId)
        .andWhere('user_id', request.user?.id)
        .first()

      if (!meal) {
        return reply.status(404).send({ error: 'Meal not found' })
      }

      return { meal }
    },
  )

  app.get(
    '/metrics',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request) => {
      // total meals
      const meals = await knex('meals').where('user_id', request.user?.id)
      const totalMeals = meals.length

      // meals in diet
      const mealsInDiet = await knex('meals').where({
        user_id: request.user?.id,
        is_on_diet: true,
      })
      const numberOfMealsInDiet = mealsInDiet.length

      // meals out of diet
      const mealsOutOfDiet = await knex('meals').where({
        user_id: request.user?.id,
        is_on_diet: false,
      })
      const numberOfMealsOutOfDiet = mealsOutOfDiet.length

      // best in diet sequence
      const { mealsInDietBestSequence } = meals.reduce(
        (acc, meal) => {
          if (meal.is_on_diet) {
            acc.currentSequence += 1
          } else {
            acc.currentSequence = 0
          }

          if (acc.currentSequence > acc.mealsInDietBestSequence) {
            acc.mealsInDietBestSequence = acc.currentSequence
          }

          return acc
        },
        { mealsInDietBestSequence: 0, currentSequence: 0 },
      )

      return {
        totalMeals,
        numberOfMealsInDiet,
        numberOfMealsOutOfDiet,
        mealsInDietBestSequence,
      }
    },
  )

  app.put(
    '/:mealId',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
      const paramsSchema = z.object({ mealId: z.string().uuid() })
      const { mealId } = paramsSchema.parse(request.params)

      const updateMealBodySchema = z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        isOnDiet: z.boolean().optional(),
      })

      const { name, description, isOnDiet } = updateMealBodySchema.parse(
        request.body,
      )

      const meal = await knex('meals')
        .where('id', mealId)
        .andWhere('user_id', request.user?.id)
        .first()

      if (!meal) {
        return reply.status(404).send({ error: 'Meal not found' })
      }

      await knex('meals').where('id', mealId).update({
        name,
        description,
        is_on_diet: isOnDiet,
        updated_at: new Date().toISOString(),
      })

      return reply.status(204).send({
        message: 'Meal successfully updated',
      })
    },
  )

  app.delete(
    '/:mealId',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
      const deleteMealBodySchema = z.object({
        mealId: z.string().uuid(),
      })

      const { mealId } = deleteMealBodySchema.parse(request.params)
      const meal = await knex('meals')
        .where('id', mealId)
        .andWhere('user_id', request.user?.id)
        .first()

      if (!meal) {
        return reply.status(404).send({ error: 'Meal not found' })
      }
      await knex('meals').where('id', mealId).del()

      return reply.status(204).send({
        message: 'Meal successfully deleted',
      })
    },
  )
}
