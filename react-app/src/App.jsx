import { Box, Container, Typography } from '@mui/material';

function App() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 4 }}>
      <Container maxWidth="md">
        <Typography variant="h4" component="h1" gutterBottom>
          React App
        </Typography>
        <Typography color="text.secondary">
          React app with Material UI. Connect to the Express API via /api.
        </Typography>
      </Container>
    </Box>
  );
}

export default App;
