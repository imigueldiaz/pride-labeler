import mongoose from 'mongoose';

const labelSchema = new mongoose.Schema({
    id: Number,
    src: String,
    uri: { type: String, required: true },
    val: { type: String, required: true },
    neg: { type: Boolean, required: true, default: false },
    cts: { type: Date, required: true, default: Date.now },
    sig: {
        $bytes: String
    },
    ver: Number
}, {
    timestamps: true
});

export const Label = mongoose.model('Label', labelSchema);
