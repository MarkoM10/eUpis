import { Request, Response } from "express";
import { login } from "./auth.service";
import { ok } from "../../shared/httpResponse";

export const loginHandler = (req: Request, res: Response): void => {
  const token = login({
    username: req.body.username,
    password: req.body.password,
  });

  res.json(
    ok("Uspesna prijava.", {
      token,
    }),
  );
};
