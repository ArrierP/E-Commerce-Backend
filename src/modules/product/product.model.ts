import { Schema, Document, model } from 'mongoose'




export interface IProduct extends Document {
    name: string,
    slug: string,
    description?: string,
    price: number,
    images: string[],
    category: string,
    stock: number,
    isActive: boolean,
    updatedAt: Date,
    createdAt: Date
}



const productSchema = new Schema<IProduct>({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    price: {
        type: Number,
        default: 0
    },
    images: {
        type: [String],
        default: []
    },
    category: {
        type: String,
        default: ""
    },
    stock: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true })


productSchema.index({ name: "text", category: "text" })



export const Product = model<IProduct>("Product", productSchema)