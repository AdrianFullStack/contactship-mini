import { 
  CanActivate, 
  ExecutionContext, 
  Injectable, 
  UnauthorizedException 
} from '@nestjs/common';

@Injectable()
export class ApiKeyGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const apiKey = request.headers['x-api-key'];
        const validApiKey = process.env.API_KEY;

        if (!apiKey || apiKey !== validApiKey) {
            throw new UnauthorizedException('API Key inválida o faltante');
        }

        return true;
    }
}