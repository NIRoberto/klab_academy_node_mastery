import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

const UserSchema = new Schema<IUser>({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
    
  }
}, {
  timestamps: true
});

export const User = mongoose.model<IUser>('User', UserSchema);
