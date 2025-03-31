
import React from "react";
import JsonRebuildApp from "@/components/JsonRebuildApp";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted py-12">
      <div className="container mx-auto px-4">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent inline-block text-transparent bg-clip-text">
            JSON Rebuilder Pro
          </h1>
          <p className="mt-3 text-xl text-gray-600">
            Extraia, edite e reconstrua JSON do Elementor em poucos cliques
          </p>
        </header>
        
        <JsonRebuildApp />
        
        <footer className="mt-16 text-center text-gray-500 text-sm">
          <p>
            © {new Date().getFullYear()} JSON Rebuilder Pro para Elementor • 
            <span className="ml-1">Faça mais em menos tempo com seus templates</span>
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
