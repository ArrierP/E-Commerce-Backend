import { Schema, Document, model } from 'mongoose'


type Role = "CUSTOMER" | "ADMIN"


export interface IUser extends Document {
    email: string,
    fullname: string,
    passwordHash: string,
    phone?: string,
    role: Role,
    isEmailVerified: boolean,
    verifyEmailToken: string | undefined,
    verifyEmailExpires: Date | undefined,
    resetPasswordToken: string | undefined,
    resetPasswordExpires: Date | undefined,
    refreshToken?: string | null,
    createdAt: Date,
    updatedAt: Date
}


const userSchema = new Schema<IUser>({
    email: {
        type: String,
        required: true,
        trim: true,
        index: true,
        lowercase: true,
        unique: true
    },
    passwordHash: {
        type: String,
        required: true
    },
    fullname: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        trim: true
    },
    role: {
        type: String,
        enum: ['CUSTOMER', "ADMIN"],
        default: "CUSTOMER"
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    verifyEmailToken: { type: String, select: false },
    verifyEmailExpires: { type: Date, select: false },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
    refreshToken: {
        type: String,
        default: null,
        trim: true
    },
}, {
    timestamps: true,
    versionKey: false
})


userSchema.methods.toJSON = function () {
    const obj = this.toObject()
    delete obj.passwordHash
    delete obj.refreshToken
    return obj
}

export const User = model<IUser>("User", userSchema)