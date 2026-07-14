import Material from '../models/Material.js';

// @desc    Add a material to a session
// @route   POST /api/materials
export const createMaterial = async (req, res) => {
    try {
        const { session, title, type, url } = req.body;
        if (!session || !title || !url) {
            return res.status(400).json({ error: 'session, title, and url are required' });
        }

        const material = new Material({ session, title, type, url });
        await material.save();
        res.status(201).json(material);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// @desc    Get all materials for a specific session
// @route   GET /api/materials/session/:sessionId
export const getSessionMaterials = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const materials = await Material.find({ session: sessionId })
            .sort({ createdAt: -1 });
        res.status(200).json(materials);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Delete a material
// @route   DELETE /api/materials/:id
export const deleteMaterial = async (req, res) => {
    try {
        const material = await Material.findByIdAndDelete(req.params.id);
        if (!material) return res.status(404).json({ error: 'Material not found' });
        res.status(200).json({ message: 'Material deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
