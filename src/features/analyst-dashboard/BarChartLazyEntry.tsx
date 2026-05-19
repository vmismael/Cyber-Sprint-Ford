// Default-export entry para suportar React.lazy.
// O BarChart usa Reanimated com várias barras animadas — é o subcomponente
// mais pesado do dashboard, ideal para code-splitting.
import { BarChart } from './BarChart';
export default BarChart;
