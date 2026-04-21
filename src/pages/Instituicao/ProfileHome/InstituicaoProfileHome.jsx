import BcEmptySection from "../../../components/BcEmptySection/BcEmptySection";
import BcTopbar from "../../../components/BcTopbar/BcTopbar";
import {
  IconeCuidadores,
  IconeCuidadoresVazio,
  IconeIdosos,
  IconeIdososVazio,
  IconeSair,
} from "../../../components/icons/Icons";
import "./InstituicaoProfileHome.css";

export default function InstituicaoProfileHome({ onLogout }) {
  return (
    <div className="instituicao-home">
      <BcTopbar
        title="Painel da Instituição"
        subtitle="Gestão de Cuidadores e Idosos"
        actionLabel="Sair"
        actionIcon={<IconeSair />}
        onAction={onLogout}
      />

      <main className="instituicao-home__content">
        <div className="instituicao-home__grid">
          <BcEmptySection
            title="Cuidadores"
            count={0}
            icon={<IconeCuidadores />}
            buttonLabel="Cadastrar Cuidador"
            emptyIcon={<IconeCuidadoresVazio />}
            emptyText="Nenhum cuidador cadastrado"
            onAction={() => {}}
          />

          <BcEmptySection
            title="Idosos"
            count={0}
            icon={<IconeIdosos />}
            buttonLabel="Cadastrar Idoso"
            emptyIcon={<IconeIdososVazio />}
            emptyText="Nenhum idoso cadastrado"
            tone="secondary"
            onAction={() => {}}
          />
        </div>
      </main>
    </div>
  );
}
