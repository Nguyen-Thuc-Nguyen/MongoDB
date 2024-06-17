import mongoose from 'mongoose';

const { Schema } = mongoose;

const educationSchema = new Schema({
    school: String,
    degree: String,
    fieldOfStudy: String,
    startDate: Date,
    endDate: Date,
    grade: String,
    activities: String,
    description: String
});

const skillSchema = new Schema({
    name: String,
    proficiency: String
});

const projectSchema = new Schema({
    name: String,
    description: String,
    role: String,
    startDate: Date,
    endDate: Date
});

const workExperienceSchema = new Schema({
    company: String,
    role: String,
    startDate: Date,
    endDate: Date,
    description: String
});

const profileSchema = new Schema({
    fullName: String,
    dateOfBirth: Date,
    placeOfBirth: String,
    nationality: String,
    education: [educationSchema],
    skills: [skillSchema],
    projects: [projectSchema],
    workExperience: [workExperienceSchema],
    hobbies: [String],
    personalGoals: [String]
});

const Profile = mongoose.model('Profile', profileSchema);

export default Profile;
