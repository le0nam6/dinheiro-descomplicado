import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Termos de Uso',
  description: 'Termos de Uso do Endinheirados — condições para utilização do site e do conteúdo.',
}

export default function TermosPage() {
  return (
    <div className="max-w-2xl mx-auto prose">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Termos de Uso</h1>
      <p className="text-sm text-gray-400 mb-8">Última atualização: junho de 2026</p>

      <p>Bem-vindo ao <strong>Endinheirados</strong>. Ao acessar e utilizar este site, você concorda com os termos descritos abaixo. Leia com atenção.</p>

      <h2>1. Sobre o conteúdo</h2>
      <p>Todo o conteúdo publicado no Endinheirados tem caráter <strong>exclusivamente informativo e educacional</strong>. As informações sobre investimentos, empréstimos, cartões de crédito e finanças em geral não constituem recomendação, consultoria ou assessoria financeira personalizada.</p>

      <h2>2. Não é consultoria financeira</h2>
      <p>O Endinheirados não é uma instituição financeira, corretora ou consultoria de investimentos registrada na CVM. Antes de tomar qualquer decisão financeira, consulte um profissional certificado (como um planejador financeiro CFP) e avalie seu perfil de investidor. Rentabilidades passadas não garantem resultados futuros.</p>

      <h2>3. Uso do site</h2>
      <p>Você concorda em utilizar este site apenas para fins legais e de maneira que não infrinja os direitos de terceiros. É proibido:</p>
      <ul>
        <li>Reproduzir o conteúdo sem autorização ou crédito</li>
        <li>Utilizar ferramentas automatizadas para extrair dados do site</li>
        <li>Tentar comprometer a segurança ou o funcionamento do site</li>
      </ul>

      <h2>4. Propriedade intelectual</h2>
      <p>Todo o conteúdo do Endinheirados — textos, logotipo, design e materiais — é protegido por direitos autorais. A reprodução total ou parcial sem autorização prévia é proibida.</p>

      <h2>5. Links externos</h2>
      <p>Este site pode conter links para sites de terceiros. Não nos responsabilizamos pelo conteúdo, políticas ou práticas desses sites externos.</p>

      <h2>6. Publicidade</h2>
      <p>O Endinheirados exibe anúncios através do Google AdSense e pode conter links de afiliados. Isso ajuda a manter o site gratuito. A presença de anúncios não constitui endosso aos produtos ou serviços anunciados.</p>

      <h2>7. Limitação de responsabilidade</h2>
      <p>O Endinheirados não se responsabiliza por decisões tomadas com base nas informações deste site, nem por eventuais perdas financeiras decorrentes dessas decisões. O uso das informações é de inteira responsabilidade do usuário.</p>

      <h2>8. Alterações nos termos</h2>
      <p>Reservamo-nos o direito de modificar estes Termos de Uso a qualquer momento. As alterações entram em vigor assim que publicadas nesta página.</p>

      <h2>9. Contato</h2>
      <p>Dúvidas sobre estes Termos de Uso? Entre em contato através da nossa <a href="/contato">página de contato</a>.</p>
    </div>
  )
}
