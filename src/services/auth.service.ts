import { AuthRepository } from "@/repositories/auth.repository";
import { UserRepository } from "@/repositories/user.repository";

export const AuthService = {
  async signIn(email: string, password: string) {
    const session = await AuthRepository.signIn(email, password);
    return session;
  },

  async signUp(email: string, password: string, displayName: string) {
    const authData = await AuthRepository.signUp(email, password, {
      display_name: displayName,
    });

    if (authData.user) {
      await UserRepository.create({
        id: authData.user.id,
        name: displayName,
        email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    return authData;
  },

  async signOut() {
    await AuthRepository.signOut();
  },

  async resetPassword(email: string) {
    const data = await AuthRepository.resetPassword(email);
    return data;
  },

  async getSession() {
    const session = await AuthRepository.getSession();
    return session;
  },

  async getCurrentUser() {
    const user = await AuthRepository.getUser();
    return user;
  },

  async isAuthenticated() {
    const session = await AuthRepository.getSession();
    return session.session !== null;
  },
};
