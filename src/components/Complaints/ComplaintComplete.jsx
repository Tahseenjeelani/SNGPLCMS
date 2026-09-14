// src/components/Complaints/ComplaintComplete.jsx
// This component is deprecated.
// Complaint status is now managed directly through the ComplaintForm edit page.
// The /complaints/complete/:id route has been removed from App.js.
import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const ComplaintComplete = () => {
    const navigate = useNavigate();
    const { id } = useParams();

    useEffect(() => {
        // Redirect to the edit page where status can be changed
        navigate(`/complaints/edit/${encodeURIComponent(id)}`, { replace: true });
    }, [id, navigate]);

    return null;
};

export default ComplaintComplete;