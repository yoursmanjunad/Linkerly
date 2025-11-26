import { Router } from "express";
import { createReport } from "../controllers/report.controllers.js";

const reportRoutes = Router();

reportRoutes.post("/", createReport);

export default reportRoutes;
