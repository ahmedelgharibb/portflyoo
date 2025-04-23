// Database setup script
const setupDatabase = async () => {
    try {
        // Read and execute the SQL file
        const response = await fetch('setup-database.sql');
        const sqlContent = await response.text();
        
        const { error } = await supabase.rpc('exec_sql', { sql: sqlContent });
        
        if (error) {
            console.error('Error setting up database:', error);
            return false;
        }
        
        console.log('Database setup completed successfully');
        return true;
    } catch (error) {
        console.error('Error in database setup:', error);
        return false;
    }
};

// Run setup when the script loads
document.addEventListener('DOMContentLoaded', async () => {
    const isSetupComplete = await setupDatabase();
    if (!isSetupComplete) {
        console.error('Database setup failed');
    }
}); 