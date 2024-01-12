import fastify from 'fastify'
import { mealsRoutes } from './routes/meals'
import { usersRoutes } from './routes/users'
import cookie from '@fastify/cookie'

export const app = fastify()

app.register(cookie)

app.register(mealsRoutes, {
  prefix: 'meals',
})

app.register(usersRoutes, {
  prefix: 'users',
})
