import { expect, test, beforeAll, afterAll, beforeEach } from 'vitest'
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

test('[create] User should be able to create a meal', async () => {
  const userResponse = await request(app.server)
    .post('/users')
    .send({ name: 'John Doe', email: 'johndoe@gmail.com' })
    .expect(201)

  const response = await request(app.server)
    .post('/meals')
    .set('Cookie', userResponse.get('Set-Cookie'))
    .send({
      name: 'fake meal',
      description: 'meal description',
      isOnDiet: true,
    })

  expect(response.statusCode).toBe(200)
})
