import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { CreditManagerService } from '../managers/credit-manager.service';
import { CreditService } from '../services/credit-manager.service';

@Injectable()
export class ReduceCreditGuard implements CanActivate {
  constructor(
    private readonly creditManagerService: CreditManagerService,
    private readonly creditService: CreditService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const res: Response = context.switchToHttp().getResponse();
    if (!req.app) return false;

    //Check if the user has a valid plan with enough balance
    const creditDetails = await this.creditManagerService.hasValidCredit(req);
    const activeCredit = await this.creditService.getActiveCredit(
      String(creditDetails.attestationCost),
    );
    if (!creditDetails['hasSufficientFund']) {
      Logger.error(
        'User does not have a valid plan or enough credits',
        'ReduceCreditGuard',
      );
      res.status(403).json({ error: 'Insufficient credits or no active plan' });
      return false;
    }
    // let remainingCreditsNeeded = creditDetails?.creditAmountRequired || 0;
    // let remainingHIDNeeded = creditDetails?.attestationCost || '0';
    // Request is processed successfully, deduct credits
    /**
     * To Do
     * handle the case where active plan has some credit but not equal to credit required. and user has some valid inactive plan
     */
    res.on('finish', async () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        Logger.log(
          'Request successful. Deducting credits now...',
          'ReduceCreditGuard',
        );
        try {
          this.creditService.updateCreditDetail(
            { _id: activeCredit._id },
            {
              used: activeCredit.used + creditDetails.creditAmountRequired,
              [`credit.amount`]:
                Number(activeCredit?.credit?.amount) -
                Number(creditDetails.attestationCost),
            },
          );
          Logger.log('Credits deducted successfully', 'ReduceCreditGuard');
        } catch (error) {
          Logger.error(
            'Error deducting credits: ' + error.message,
            'ReduceCreditGuard',
          );
        }
      } else {
        Logger.warn(
          'Request failed. Skipping credit deduction.',
          'ReduceCreditGuard',
        );
      }
    });

    return true;
  }
}
