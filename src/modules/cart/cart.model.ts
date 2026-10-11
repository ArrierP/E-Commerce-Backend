import { Schema, Document, model, Types } from 'mongoose'

export interface ICartItem {
    productId: Types.ObjectId,
    quantity: number,
}
export interface ICart extends Document {
    userId: Types.ObjectId,
    items: ICartItem[],
    createdAt: Date,
    updatedAt: Date
}




const cartItemSchema = new Schema<ICartItem>({
    productId: {
        type: Types.ObjectId,
        ref: "Product",
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: [1, "Quantity must be at least 1 character."],
        default: 0
    }
}, { _id: false })

const cartSchema = new Schema<ICart>({
    userId: {
        type: Types.ObjectId,
        ref: "User",
        unique: true,
        required: true,
        index: true
    },
    items: [cartItemSchema],

}, { timestamps: true })

export const Cart = model<ICart>("Cart", cartSchema)

