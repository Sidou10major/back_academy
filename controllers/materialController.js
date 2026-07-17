import Material from '../models/Material.js';

// @desc    Add a material to a session
// @route   POST /api/materials
export const createMaterial = async (req, res) => {
    try {
        const { session, title, type, url, uploadedBy } = req.body;
        
        let materialData = {
            session,
            title,
            type: type || 'Reading',
            uploadedBy: uploadedBy || null
        };

        if (req.file) {
            materialData.url = `/uploads/${req.file.filename}`;
            materialData.originalName = req.file.originalname;
            materialData.mimeType = req.file.mimetype;
            materialData.fileSize = req.file.size;
        } else {
            if (!url) {
                return res.status(400).json({ error: 'Either a file upload or an external URL is required' });
            }
            materialData.url = url;
            materialData.originalName = req.body.originalName || '';
            materialData.mimeType = req.body.mimeType || 'text/html';
            materialData.fileSize = req.body.fileSize || 0;
        }

        if (!session || !title) {
            return res.status(400).json({ error: 'session and title are required' });
        }

        const material = new Material(materialData);
        await material.save();
        
        const populated = await Material.findById(material._id)
            .populate('uploadedBy', 'firstName lastName role');
            
        res.status(201).json(populated);
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
            .populate('uploadedBy', 'firstName lastName role')
            .sort({ createdAt: -1 });
        res.status(200).json(materials);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Get all materials (with optional filters)
// @route   GET /api/materials
export const getAllMaterials = async (req, res) => {
    try {
        const { session, uploadedBy } = req.query;
        let query = {};
        if (session) query.session = session;
        if (uploadedBy) query.uploadedBy = uploadedBy;

        const materials = await Material.find(query)
            .populate('uploadedBy', 'firstName lastName role')
            .populate({
                path: 'session',
                populate: { path: 'course', select: 'title language level' }
            })
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
