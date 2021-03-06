import express from 'express';
import { findAll, findOne } from '../controllers/companyController.js';
let companyRouter = express.Router();

companyRouter.get('/', findAll);
companyRouter.get('/:id', findOne);

export default companyRouter;
