import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Privacidade',
  description: 'Política de Privacidade do Endinheirados — como coletamos, usamos e protegemos seus dados.',
}

export default function PrivacidadePage() {
  return (
    <div className="max-w-2xl mx-auto prose">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Política de Privacidade</h1>
      <p className="text-sm text-gray-400 mb-8">Última atualização: junho de 2026</p>

      <p>O <strong>Endinheirados</strong> respeita a sua privacidade e está comprometido em proteger os dados pessoais dos visitantes deste site. Esta Política de Privacidade explica como coletamos, usamos e protegemos suas informações, em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).</p>

      <h2>1. Informações que coletamos</h2>
      <p>Coletamos informações de forma automática quando você navega no site, incluindo:</p>
      <ul>
        <li>Endereço IP e dados de localização aproximada</li>
        <li>Tipo de navegador e dispositivo</li>
        <li>Páginas visitadas e tempo de permanência</li>
        <li>Origem do acesso (mecanismo de busca, link direto, redes sociais)</li>
      </ul>
      <p>Caso você se inscreva em nossa newsletter, coletamos também o endereço de e-mail fornecido voluntariamente.</p>

      <h2>2. Como usamos as informações</h2>
      <p>Utilizamos os dados coletados para:</p>
      <ul>
        <li>Melhorar a experiência de navegação e o conteúdo do site</li>
        <li>Analisar métricas de audiência e desempenho</li>
        <li>Exibir anúncios relevantes</li>
        <li>Enviar newsletters, quando autorizado</li>
      </ul>

      <h2>3. Cookies</h2>
      <p>Este site utiliza cookies para melhorar a experiência do usuário e para fins de análise e publicidade. Cookies são pequenos arquivos armazenados no seu navegador. Você pode desativá-los nas configurações do seu navegador a qualquer momento, embora isso possa afetar algumas funcionalidades.</p>

      <h2>4. Google AdSense e cookies de terceiros</h2>
      <p>Utilizamos o Google AdSense para exibir anúncios. O Google, como fornecedor terceirizado, utiliza cookies para veicular anúncios com base nas visitas anteriores do usuário a este e a outros sites.</p>
      <p>O uso de cookies de publicidade pelo Google permite que ele e seus parceiros veiculem anúncios para os usuários com base na visita a este site e/ou a outros sites na Internet. Os usuários podem desativar a publicidade personalizada acessando as <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">Configurações de anúncios do Google</a>.</p>

      <h2>5. Google Analytics</h2>
      <p>Usamos o Google Analytics para entender como os visitantes interagem com o site. Essa ferramenta coleta dados de forma anônima e agregada, ajudando-nos a melhorar continuamente o conteúdo.</p>

      <h2>6. Compartilhamento de dados</h2>
      <p>Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros, exceto quando necessário para o funcionamento dos serviços mencionados (Google Analytics, Google AdSense) ou por obrigação legal.</p>

      <h2>7. Seus direitos (LGPD)</h2>
      <p>De acordo com a LGPD, você tem direito a acessar, corrigir, excluir ou solicitar a portabilidade dos seus dados pessoais. Para exercer esses direitos, entre em contato pela nossa <a href="/contato">página de contato</a>.</p>

      <h2>8. Segurança</h2>
      <p>Adotamos medidas técnicas e organizacionais para proteger seus dados contra acesso não autorizado, perda ou alteração.</p>

      <h2>9. Alterações nesta política</h2>
      <p>Esta Política de Privacidade pode ser atualizada periodicamente. Recomendamos que você a revise regularmente. A data da última atualização está indicada no topo desta página.</p>

      <h2>10. Contato</h2>
      <p>Em caso de dúvidas sobre esta Política de Privacidade, entre em contato através da nossa <a href="/contato">página de contato</a>.</p>
    </div>
  )
}
