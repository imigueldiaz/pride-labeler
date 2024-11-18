import mongoose from 'mongoose';

const labelSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    src: String,
    uri: { type: String, required: true },
    val: { type: String, required: true },
    neg: { type: Boolean, required: true, default: false },
    cts: { type: Date, required: true, default: Date.now },
    sig: { type: Map, of: String, default: () => ({}) }
}, {
    timestamps: true
});

// Crear índice único para evitar duplicados
labelSchema.index({ uri: 1, val: 1, neg: 1 }, { unique: true });
// Crear índice único para IDs
labelSchema.index({ id: 1 }, { unique: true });

export const Label = mongoose.model('Label', labelSchema);
