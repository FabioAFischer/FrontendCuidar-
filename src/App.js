import './App.css';
import CadastroUsuario from './pages/Administrador/Cadastroinstituicao';

function App() {
  return (
    <div className="App">
      <CadastroUsuario
        onVoltar={() => console.log("Voltar clicado")}
        onSucesso={() => console.log("Cadastro concluído")}
      />
    </div>
  );
}

export default App;