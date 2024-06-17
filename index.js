import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from './model/user.js';
import Profile from './model/profile.js';

dotenv.config();

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

app.use(express.json({ limit: '50mb' }));
app.use(cors());

app.post('/api/signup', async (req, res) => {
    try {
        const { username, password } = req.body;
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();
        res.json({ message: 'User created successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        const token = jwt.sign({ userId: user._id }, JWT_SECRET);
        res.json({ token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    jwt.verify(token, JWT_SECRET, (err, decodedToken) => {
        if (err) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        req.userId = decodedToken.userId;
        next();
    });
};

app.post('/api/profile', verifyToken, async (req, res) => {
    try {
        const { fullName, dateOfBirth, placeOfBirth, nationality, education, skills, projects, workExperience, hobbies, personalGoals } = req.body;
        const newProfile = new Profile({
            fullName, dateOfBirth, placeOfBirth, nationality,
            education, skills, projects, workExperience, hobbies, personalGoals
        });
        await newProfile.save();
        await User.findByIdAndUpdate(req.userId, { profile: newProfile._id });
        res.json({ message: 'Profile created successfully', profile: newProfile });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/profile', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.userId).populate('profile');
        if (!user || !user.profile) {
            return res.status(404).json({ error: 'Profile not found' });
        }
        res.json({ profile: user.profile });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.put('/api/profile', verifyToken, async (req, res) => {
    try {
        const { fullName, dateOfBirth, placeOfBirth, nationality, education, skills, projects, workExperience, hobbies, personalGoals } = req.body;
        const updatedProfile = await Profile.findByIdAndUpdate(req.userId, {
            fullName, dateOfBirth, placeOfBirth, nationality,
            education, skills, projects, workExperience, hobbies, personalGoals
        }, { new: true });
        if (!updatedProfile) {
            return res.status(404).json({ error: 'Profile not found' });
        }
        res.json({ message: 'Profile updated successfully', profile: updatedProfile });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.delete('/api/profile', verifyToken, async (req, res) => {
    try {
        const deletedProfile = await Profile.findByIdAndDelete(req.userId);
        if (!deletedProfile) {
            return res.status(404).json({ error: 'Profile not found' });
        }
        res.json({ message: 'Profile deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

const startServer = async () => {
    try {
        await mongoose.connect(process.env.DB_CONNECTION_STRING, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('DB connected');

        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Error connecting to the database', error);
        process.exit(1);
    }
};

startServer();
