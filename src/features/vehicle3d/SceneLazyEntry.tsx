// Default-export entry para suportar React.lazy.
// Mantém Scene.tsx com sua API named-export, e isola este arquivo como
// chunk a ser carregado sob demanda quando o usuário abre vehicle/[id].
import { Scene } from './Scene';
export default Scene;
