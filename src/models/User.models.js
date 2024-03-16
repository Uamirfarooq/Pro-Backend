import mongoose ,{Schema, model} from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        index: true,
        lowercase: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
    },
    fullName: {
        type: String,
        required: true,
        index: true,
    },
    avatar: {
        type: String,
        required: true,
    },
    coverImage: {
        type: String,
    },
    password: {
        type: [String, 'Password is required'],
        required: true,
    },
    refreshToken: {
        type: String,
        required: true,
    },
    watchHistory: {
        type: Schema.Types.ObjectId,
        ref: "Video"
    }
},{timestamps: true});

userSchema.pre('save', async function(next){

    if(!this.isModified('password')) return next();

    this.password = await bcrypt.hash(this.password, 10)
    next()
})

userSchema.methods.isPasswordCorrect = function(password){
    return bcrypt.compare(password, this.password)
}

userSchema.methods.genrateAccessToken = function () {
    jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
        
    )
}
userSchema.methods.genrateRefreshToken = function () {
    jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
        
    )
}

export const User = model('User',userSchema)