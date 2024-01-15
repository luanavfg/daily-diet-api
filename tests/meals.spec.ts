import { expect, test, beforeAll, afterAll, beforeEach, describe } from 'vitest'
import request from 'supertest'
import { app } from '../src/app'
import { execSync } from 'child_process'

beforeAll(async () => {
  await app.ready()
})

afterAll(async () => {
  await app.close()
})

beforeEach(() => {
  execSync('npm run knex migrate:rollback --all')
  execSync('npm run knex migrate:latest')
})

describe('Meals Routes', () => {
  test('[create] User should be able to create a meal', async () => {
    const userResponse = await request(app.server)
      .post('/users')
      .send({ name: 'John Doe', email: 'johndoe@gmail.com' })
      .expect(201)

    const response = await request(app.server)
      .post('/meals')
      .set('Cookie', userResponse.get('Set-Cookie'))
      .send({
        name: 'Breakfast',
        description: 'Breakfast',
        isOnDiet: true,
      })

    expect(response.statusCode).toBe(200)
  })

  test('[get] User should be able to see a list of meals', async () => {
    const userResponse = await request(app.server)
      .post('/users')
      .send({ name: 'John Doe', email: 'johndoe@gmail.com' })
      .expect(201)

    await request(app.server)
      .post('/meals')
      .set('Cookie', userResponse.get('Set-Cookie'))
      .send({
        name: 'Breakfast',
        description: 'Breakfast',
        isOnDiet: true,
      })
      .expect(200)

    await request(app.server)
      .post('/meals')
      .set('Cookie', userResponse.get('Set-Cookie'))
      .send({
        name: 'Dinner',
        description: 'Dinner',
        isOnDiet: false,
      })
      .expect(200)

    const mealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', userResponse.get('Set-Cookie'))

    expect(mealsResponse.body.meals).toEqual([
      expect.objectContaining({
        id: expect.any(String),
        user_id: expect.any(String),
        name: 'Breakfast',
        description: 'Breakfast',
        is_on_diet: 1,
        created_at: expect.any(String),
        updated_at: null,
      }),
      expect.objectContaining({
        id: expect.any(String),
        user_id: expect.any(String),
        name: 'Dinner',
        description: 'Dinner',
        is_on_diet: 0,
        created_at: expect.any(String),
        updated_at: null,
      }),
    ])
  })

  test('[get] User should be able to see a specific meal', async () => {
    const userResponse = await request(app.server)
      .post('/users')
      .send({ name: 'John Doe', email: 'johndoe@gmail.com' })
      .expect(201)

    await request(app.server)
      .post('/meals')
      .set('Cookie', userResponse.get('Set-Cookie'))
      .send({
        name: 'Lunch',
        description: 'Lunch',
        isOnDiet: true,
      })
      .expect(200)

    const mealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', userResponse.get('Set-Cookie'))
      .expect(200)

    const mealId = mealsResponse.body.meals[0].id

    const mealResponse = await request(app.server)
      .get(`/meals/${mealId}`)
      .set('Cookie', userResponse.get('Set-Cookie'))

    expect(mealResponse.body.meal).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        user_id: expect.any(String),
        name: 'Lunch',
        description: 'Lunch',
        is_on_diet: 1,
        created_at: expect.any(String),
        updated_at: null,
      }),
    )
  })

  test('[update] User should be able update a meal', async () => {
    const userResponse = await request(app.server)
      .post('/users')
      .send({ name: 'John Doe', email: 'johndoe@gmail.com' })
      .expect(201)

    await request(app.server)
      .post('/meals')
      .set('Cookie', userResponse.get('Set-Cookie'))
      .send({
        name: 'Lunch',
        description: 'Lunch',
        isOnDiet: true,
      })
      .expect(200)

    const mealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', userResponse.get('Set-Cookie'))
      .expect(200)

    const mealId = mealsResponse.body.meals[0].id

    await request(app.server)
      .put(`/meals/${mealId}`)
      .set('Cookie', userResponse.get('Set-Cookie'))
      .send({
        name: 'Snack',
        description: 'Snack',
        isOnDiet: false,
      })
      .expect(204)

    const mealResponse = await request(app.server)
      .get(`/meals/${mealId}`)
      .set('Cookie', userResponse.get('Set-Cookie'))

    expect(mealResponse.body.meal).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        user_id: expect.any(String),
        name: 'Snack',
        description: 'Snack',
        is_on_diet: 0,
        created_at: expect.any(String),
        updated_at: expect.any(String),
      }),
    )
  })

  test('[get] User should be able to get the meals metrics', async () => {
    const userResponse = await request(app.server)
      .post('/users')
      .send({ name: 'John Doe', email: 'johndoe@gmail.com' })
      .expect(201)

    await request(app.server)
      .post('/meals')
      .set('Cookie', userResponse.get('Set-Cookie'))
      .send({
        name: 'Breakfast',
        description: 'Bread',
        isOnDiet: true,
      })
      .expect(200)

    await request(app.server)
      .post('/meals')
      .set('Cookie', userResponse.get('Set-Cookie'))
      .send({
        name: 'Snack',
        description: 'Fruit',
        isOnDiet: true,
      })
      .expect(200)

    await request(app.server)
      .post('/meals')
      .set('Cookie', userResponse.get('Set-Cookie'))
      .send({
        name: 'Lunch',
        description: 'Rice and Beans with fish',
        isOnDiet: true,
      })
      .expect(200)

    await request(app.server)
      .post('/meals')
      .set('Cookie', userResponse.get('Set-Cookie'))
      .send({
        name: 'Snack afternoon',
        description: 'Cookies',
        isOnDiet: false,
      })
      .expect(200)

    await request(app.server)
      .post('/meals')
      .set('Cookie', userResponse.get('Set-Cookie'))
      .send({
        name: 'Dinner',
        description: 'Pizza',
        isOnDiet: false,
      })
      .expect(200)

    const mealsMetricsResponse = await request(app.server)
      .get('/meals/metrics')
      .set('Cookie', userResponse.get('Set-Cookie'))
      .expect(200)

    expect(mealsMetricsResponse.body).toEqual(
      expect.objectContaining({
        totalMeals: 5,
        numberOfMealsInDiet: 3,
        numberOfMealsOutOfDiet: 2,
        mealsInDietBestSequence: 3,
      }),
    )
  })

  test('[delete] User should be able delete a meal', async () => {
    const userResponse = await request(app.server)
      .post('/users')
      .send({ name: 'John Doe', email: 'johndoe@gmail.com' })
      .expect(201)

    await request(app.server)
      .post('/meals')
      .set('Cookie', userResponse.get('Set-Cookie'))
      .send({
        name: 'Lunch',
        description: 'Lunch',
        isOnDiet: true,
      })
      .expect(200)

    const mealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', userResponse.get('Set-Cookie'))
      .expect(200)

    const mealId = mealsResponse.body.meals[0].id

    await request(app.server)
      .delete(`/meals/${mealId}`)
      .set('Cookie', userResponse.get('Set-Cookie'))
      .expect(204)

    await request(app.server)
      .get(`/meals/${mealId}`)
      .set('Cookie', userResponse.get('Set-Cookie'))
      .expect(404)
  })
})
