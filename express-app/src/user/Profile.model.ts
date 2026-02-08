import mongoose, { Schema } from 'mongoose';

export interface IProfile {
  _id: mongoose.Types.ObjectId;
  user_id: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const profileSchema = new Schema<IProfile>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
  },
  { timestamps: true }
);

export const Profile = mongoose.model<IProfile>('Profile', profileSchema);
