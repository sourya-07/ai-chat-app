import {Router} from 'express'
import * as userController from '../controllers/user.controllers.js'
import { body } from 'express-validator'

const router = Router()

router.post(
    '/register',
    body('email').isEmail().withMessage('Email must be a vaild email address'),
    body('password').isLength({min: 3}).withMessage('Password must be at least 3 characters'),

    userController.createUserController)



export default router