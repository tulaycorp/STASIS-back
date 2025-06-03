const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Routes

// Get all curricula
app.get('/api/curricula', (req, res) => {
    try {
        res.json({
            success: true,
            data: curricula,
            message: 'Curricula retrieved successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving curricula',
            error: error.message
        });
    }
});

// Get single curriculum by ID
app.get('/api/curricula/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const curriculum = curricula.find(c => c.id === id);
        
        if (!curriculum) {
            return res.status(404).json({
                success: false,
                message: 'Curriculum not found'
            });
        }
        
        res.json({
            success: true,
            data: curriculum,
            message: 'Curriculum retrieved successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving curriculum',
            error: error.message
        });
    }
});

// Create new curriculum
app.post('/api/curricula', (req, res) => {
    try {
        const { name, code, program, academicYear, status } = req.body;
        
        // Basic validation
        if (!name || !code || !program || !academicYear) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: name, code, program, academicYear'
            });
        }
        
        // Check if code already exists
        const existingCurriculum = curricula.find(c => c.code === code);
        if (existingCurriculum) {
            return res.status(409).json({
                success: false,
                message: 'Curriculum code already exists'
            });
        }
        
        const newCurriculum = {
            id: curricula.length + 1,
            name,
            code,
            program,
            academicYear,
            status: status || 'draft',
            lastUpdated: new Date().toISOString().split('T')[0]
        };
        
        curricula.push(newCurriculum);
        
        res.status(201).json({
            success: true,
            data: newCurriculum,
            message: 'Curriculum created successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating curriculum',
            error: error.message
        });
    }
});

// Update curriculum
app.put('/api/curricula/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const curriculumIndex = curricula.findIndex(c => c.id === id);
        
        if (curriculumIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Curriculum not found'
            });
        }
        
        const { name, code, program, academicYear, status } = req.body;
        
        // Update curriculum
        curricula[curriculumIndex] = {
            ...curricula[curriculumIndex],
            ...(name && { name }),
            ...(code && { code }),
            ...(program && { program }),
            ...(academicYear && { academicYear }),
            ...(status && { status }),
            lastUpdated: new Date().toISOString().split('T')[0]
        };
        
        res.json({
            success: true,
            data: curricula[curriculumIndex],
            message: 'Curriculum updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating curriculum',
            error: error.message
        });
    }
});

// Delete curriculum
app.delete('/api/curricula/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const curriculumIndex = curricula.findIndex(c => c.id === id);
        
        if (curriculumIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Curriculum not found'
            });
        }
        
        const deletedCurriculum = curricula.splice(curriculumIndex, 1)[0];
        
        res.json({
            success: true,
            data: deletedCurriculum,
            message: 'Curriculum deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting curriculum',
            error: error.message
        });
    }
});

// Search curricula
app.get('/api/curricula/search/:query', (req, res) => {
    try {
        const query = req.params.query.toLowerCase();
        const filteredCurricula = curricula.filter(curriculum =>
            curriculum.name.toLowerCase().includes(query) ||
            curriculum.program.toLowerCase().includes(query) ||
            curriculum.code.toLowerCase().includes(query)
        );
        
        res.json({
            success: true,
            data: filteredCurricula,
            message: `Found ${filteredCurricula.length} matching curricula`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error searching curricula',
            error: error.message
        });
    }
});

// Auth endpoint (similar to your existing one)
app.post('/api/auth/login', (req, res) => {
    try {
        const { username, password, role } = req.body;
        
        // Mock authentication (replace with real authentication)
        if (username === 'admin' && password === 'password' && role === 'faculty') {
            res.json({
                success: true,
                userDisplayName: 'David Anderson',
                role: 'faculty',
                message: 'Login successful'
            });
        } else {
            res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Login error',
            error: error.message
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`API endpoints available at http://localhost:${PORT}/api/`);
});

module.exports = app;

export default CurricullumManagement;