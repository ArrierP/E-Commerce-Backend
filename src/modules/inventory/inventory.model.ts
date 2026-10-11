import { Schema, Document, model, Types } from "mongoose";

export interface IInventory extends Document {
    productId: Types.ObjectId;
    stock: number;
    reservedStock: number;
    lowStockThreshold: number;
    createdAt: Date;
    updatedAt: Date;
}

const inventorySchema = new Schema<IInventory>(
    {
        productId: {
            type: Schema.Types.ObjectId,
            ref: "Product",
            required: true,
            unique: true,
            index: true
        },
        stock: {
            type: Number,
            required: true,
            min: 0,
            default: 0
        },
        reservedStock: {
            type: Number,
            required: true,
            min: 0,
            default: 0
        },
        lowStockThreshold: {
            type: Number,
            required: true,
            min: 0,
            default: 5
        }
    },
    { timestamps: true }
);

export const Inventory = model<IInventory>("Inventory", inventorySchema);