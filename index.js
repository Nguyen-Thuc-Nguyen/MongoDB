import express from 'express';
import dotenv from "dotenv"
import mongoose from "mongoose"
import cors from "cors"
import User from "./model/user"
import Profile from "./model/profile"

dotenv.config()

const app = express();

app.use(express.json({
    limit: '50mb'
}))
app.use(cors())

//
// try{
// await mongoose.connect()
// }catch(err){
// }
mongoose.connect(process.env.DB_CONNECTION_STRING).then(
    () => {
        console.log("DB connected")



        // token:
        // accessToken 

        // 2 types of route

        // - private routes: /my-profile ; /my-wallet ; /my-class 
        // ---> authenticated required

        // - public routes: /login /register ->
        // ---> Authenticate user: accessToken

        // 1 user want to use private routes 
        // /register -> /login [accessToken]

        // headers:{Authorization:`Bearer ${accessToken}`}
        // /my-profile -> middleware(authentication) -> accessToken verify -> userID


        // routes
        //
        // @@POST /login
        // Login
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

        // Login
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
            const token = req.headers.authorization;
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
                const updatedProfile = await Profile.findOneAndUpdate({ _id: req.userId }, {
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
                const deletedProfile = await Profile.findOneAndDelete({ _id: req.userId });
                if (!deletedProfile) {
                    return res.status(404).json({ error: 'Profile not found' });
                }
                res.json({ message: 'Profile deleted successfully' });
            } catch (error) {
                console.error(error);
                res.status(500).json({ error: 'Server error' });
            }
        });
    }
).catch(err => {
    console.log(err)
    process.exit(1)
})