import mongoose, { Schema, Document, CallbackError } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  username: string;
  password: string;
  role: string;
  comparePassword(candidate: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, default: "admin" },
  },
  { timestamps: true }
);

UserSchema.pre("save", async function (next: (err?: CallbackError) => void) {
  try {
    if (!this.isModified("password")) return next();
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err as CallbackError);
  }
});

UserSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

export const User = mongoose.model<IUser>("User", UserSchema);
