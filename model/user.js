import mongoose from 'mongoose';

const { Schema } = mongoose;

const userSchema = new Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profile: { type: Schema.Types.ObjectId, ref: 'Profile' }
});

const User = mongoose.model('User', userSchema);

export default User;
