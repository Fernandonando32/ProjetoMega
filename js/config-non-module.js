// Configuração do Supabase (versão não-módulo)
const SUPABASE_CONFIG = { 
    url: "https://ryttlyigvimycygnzfju.supabase.co",
    key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5dHRseWlndmlteWN5Z256Zmp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3MzE5OTYsImV4cCI6MjA2MjMwNzk5Nn0.njG4i1oZ3Ex9s490eTdXCaREInxM4aEgHazf8UhRTOA"
}; 

// Tornar disponível globalmente
window.SUPABASE_CONFIG = SUPABASE_CONFIG;

console.log('Config não-módulo carregada com sucesso'); 