import bcrypt from 'bcryptjs';

/**
 * Gera o salt e encripta a senha informada.
 * @param password Senha em texto limpo.
 * @returns Promessa com o hash gerado.
 */
export async function saltAndHashPassword(password: string): Promise<string> {
  // 12 rounds é o padrão recomendado para segurança atual
  const costRounds = 12; 
  
  const salt = await bcrypt.genSalt(costRounds);
  return bcrypt.hash(password, salt);
}
