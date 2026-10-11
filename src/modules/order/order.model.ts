import { Schema, Document, model, Types } from 'mongoose'


interface IOrderItem {
    productId: Types.ObjectId,
    name: string,
    price: number,
    quantity: number
}

type Status = 'pending' | "paid" | "shipping" | "completed" | "cancelled"

export interface IOrder extends Document {
    userId: Types.ObjectId,
    items: IOrderItem[],
    totalAmount: number,
    shippingAddress: string,
    status: Status,
    createdAt: Date,
    updatedAt: Date
}

const orderItemSchema = new Schema<IOrderItem>({
    productId: {
        type: Types.ObjectId,
        ref: "Product",
        required: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    price: {
        type: Number,
        required: true,
        min: [0, "Price cannot be negative"],
    },
    quantity: {
        type: Number,
        required: true,
        min: [0, "Quantity cannot be negative"],
    }
}, { _id: false })

const orderSchema = new Schema<IOrder>({
    userId: {
        type: Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    items: {
        type: [orderItemSchema],
        required: true,
        validate: [
            (val: IOrderItem[]) => val.length > 0,
            "Order must have at least one item",
        ],
    },
    totalAmount: {
        type: Number,
        required: true,
        default: 0
    },
    shippingAddress: {
        type: String,
        required: true,
        trim: true,
        default: ''
    },
    status: {
        type: String,
        enum: {
            values: ["pending", "paid", "shipping", "completed", "cancelled"],
            message: "{VALUE} is not a valid order status",
        },
        default: "pending",
        index: true, 
    }
}, { timestamps: true })

orderSchema.index({ userId: 1, createdAt: -1 });

export const Order = model<IOrder>("Order", orderSchema)