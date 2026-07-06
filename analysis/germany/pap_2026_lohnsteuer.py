from decimal import Decimal, ROUND_DOWN, ROUND_UP, getcontext


getcontext().prec = 28


ZERO = Decimal("0")
ONE = Decimal("1")
TWO = Decimal("2")
SEVEN = Decimal("7")
TWELVE = Decimal("12")
ONE_HUNDRED = Decimal("100")
THREE_HUNDRED_SIXTY = Decimal("360")
SEVEN_HUNDRED = Decimal("700")
TEN_THOUSAND = Decimal("10000")


def d(value) -> Decimal:
    return Decimal(str(value))


def round_down(value: Decimal, digits: int = 0) -> Decimal:
    return value.quantize(
        Decimal("1") if digits == 0 else Decimal("1." + "0" * digits),
        rounding=ROUND_DOWN
    )


def round_up(value: Decimal, digits: int = 0) -> Decimal:
    return value.quantize(
        Decimal("1") if digits == 0 else Decimal("1." + "0" * digits),
        rounding=ROUND_UP
    )


class Pap2026Lohnsteuer:
    def __init__(
        self,
        gross_monthly_eur: float,
        steuerklasse: int = 1,
        additional_health_rate_percent: float = 2.9,
        saxony: bool = False,
        childless: bool = False,
        child_allowances: float = 0.0,
        church_tax: bool = False,
    ) -> None:
        self.af = 1
        self.AJAHR = 0
        self.ALTER1 = 0
        self.ALV = 0
        self.f = Decimal("1.0")

        self.JFREIB = ZERO
        self.JHINZU = ZERO
        self.JRE4 = ZERO
        self.JRE4ENT = ZERO
        self.JVBEZ = ZERO

        self.KRV = 0
        self.KVZ = d(additional_health_rate_percent)

        self.LZZ = 2
        self.LZZFREIB = ZERO
        self.LZZHINZU = ZERO

        self.MBV = ZERO
        self.PKPV = ZERO
        self.PKPVAGZ = ZERO
        self.PKV = 0

        self.PVA = ZERO
        self.PVS = 1 if saxony else 0
        self.PVZ = 1 if childless else 0

        self.R = 1 if church_tax else 0
        self.RE4 = round_down(d(gross_monthly_eur) * ONE_HUNDRED, 0)

        self.SONSTB = ZERO
        self.SONSTENT = ZERO
        self.STERBE = ZERO
        self.STKL = steuerklasse

        self.VBEZ = ZERO
        self.VBEZM = ZERO
        self.VBEZS = ZERO
        self.VBS = ZERO
        self.VJAHR = 0
        self.ZKF = d(child_allowances)
        self.ZMVB = 0

        self.BK = ZERO
        self.BKS = ZERO
        self.LSTLZZ = ZERO
        self.SOLZLZZ = ZERO
        self.SOLZS = ZERO
        self.STS = ZERO

        self.reset_internals()

    def reset_internals(self) -> None:
        self.ALTE = ZERO
        self.ANP = ZERO
        self.ANTEIL1 = ZERO
        self.AVSATZAN = ZERO
        self.BBGKVPV = ZERO
        self.BBGRVALV = ZERO
        self.BMG = ZERO
        self.DIFF = ZERO
        self.EFA = ZERO
        self.FVB = ZERO
        self.FVBSO = ZERO
        self.FVBZ = ZERO
        self.FVBZSO = ZERO
        self.GFB = ZERO
        self.HBALTE = ZERO
        self.HFVB = ZERO
        self.HFVBZ = ZERO
        self.HFVBZSO = ZERO
        self.HOCH = ZERO
        self.J = 0
        self.JBMG = ZERO
        self.JLFREIB = ZERO
        self.JLHINZU = ZERO
        self.JW = ZERO
        self.K = 0
        self.KFB = ZERO
        self.KVSATZAN = ZERO
        self.KZTAB = 0
        self.LSTJAHR = ZERO
        self.LSTOSO = ZERO
        self.LSTSO = ZERO
        self.MIST = ZERO
        self.PKPVAGZJ = ZERO
        self.PVSATZAN = ZERO
        self.RVSATZAN = ZERO
        self.RW = ZERO
        self.SAP = ZERO
        self.SOLZFREI = ZERO
        self.SOLZJ = ZERO
        self.SOLZMIN = ZERO
        self.SOLZSBMG = ZERO
        self.SOLZSZVE = ZERO
        self.ST = ZERO
        self.ST1 = ZERO
        self.ST2 = ZERO
        self.VBEZB = ZERO
        self.VBEZBSO = ZERO
        self.VERGL = ZERO
        self.VSPHB = ZERO
        self.VSP = ZERO
        self.VSPN = ZERO
        self.VSPALV = ZERO
        self.VSPKVPV = ZERO
        self.VSPR = ZERO
        self.W1STKL5 = ZERO
        self.W2STKL5 = ZERO
        self.W3STKL5 = ZERO
        self.X = ZERO
        self.Y = ZERO
        self.ZRE4 = ZERO
        self.ZRE4J = ZERO
        self.ZRE4VP = ZERO
        self.ZRE4VPR = ZERO
        self.ZTABFB = ZERO
        self.ZVBEZ = ZERO
        self.ZVBEZJ = ZERO
        self.ZVE = ZERO
        self.ZX = ZERO
        self.ZZX = ZERO

    def main(self) -> None:
        self.MPARA()
        self.MRE4JL()
        self.VBEZBSO = ZERO
        self.MRE4()
        self.MRE4ABZ()
        self.MBERECH()
        self.MSONST()

    def MPARA(self) -> None:
        self.BBGRVALV = d("101400")
        self.AVSATZAN = d("0.013")
        self.RVSATZAN = d("0.093")
        self.BBGKVPV = d("69750")
        self.KVSATZAN = (self.KVZ / TWO / ONE_HUNDRED) + d("0.07")

        if self.PVS == 1:
            self.PVSATZAN = d("0.023")
        else:
            self.PVSATZAN = d("0.018")

        if self.PVZ == 1:
            self.PVSATZAN = self.PVSATZAN + d("0.006")
        else:
            self.PVSATZAN = self.PVSATZAN - (self.PVA * d("0.0025"))

        self.W1STKL5 = d("14071")
        self.W2STKL5 = d("34939")
        self.W3STKL5 = d("222260")
        self.GFB = d("12348")
        self.SOLZFREI = d("20350")

    def MRE4JL(self) -> None:
        if self.LZZ == 1:
            self.ZRE4J = round_down(self.RE4 / ONE_HUNDRED, 2)
            self.ZVBEZJ = round_down(self.VBEZ / ONE_HUNDRED, 2)
            self.JLFREIB = round_down(self.LZZFREIB / ONE_HUNDRED, 2)
            self.JLHINZU = round_down(self.LZZHINZU / ONE_HUNDRED, 2)
        elif self.LZZ == 2:
            self.ZRE4J = round_down((self.RE4 * TWELVE) / ONE_HUNDRED, 2)
            self.ZVBEZJ = round_down((self.VBEZ * TWELVE) / ONE_HUNDRED, 2)
            self.JLFREIB = round_down((self.LZZFREIB * TWELVE) / ONE_HUNDRED, 2)
            self.JLHINZU = round_down((self.LZZHINZU * TWELVE) / ONE_HUNDRED, 2)
        elif self.LZZ == 3:
            self.ZRE4J = round_down((self.RE4 * THREE_HUNDRED_SIXTY) / SEVEN_HUNDRED, 2)
            self.ZVBEZJ = round_down((self.VBEZ * THREE_HUNDRED_SIXTY) / SEVEN_HUNDRED, 2)
            self.JLFREIB = round_down((self.LZZFREIB * THREE_HUNDRED_SIXTY) / SEVEN_HUNDRED, 2)
            self.JLHINZU = round_down((self.LZZHINZU * THREE_HUNDRED_SIXTY) / SEVEN_HUNDRED, 2)
        else:
            self.ZRE4J = round_down((self.RE4 * THREE_HUNDRED_SIXTY) / ONE_HUNDRED, 2)
            self.ZVBEZJ = round_down((self.VBEZ * THREE_HUNDRED_SIXTY) / ONE_HUNDRED, 2)
            self.JLFREIB = round_down((self.LZZFREIB * THREE_HUNDRED_SIXTY) / ONE_HUNDRED, 2)
            self.JLHINZU = round_down((self.LZZHINZU * THREE_HUNDRED_SIXTY) / ONE_HUNDRED, 2)

        if self.af == 0:
            self.f = ONE

    def MRE4(self) -> None:
        self.FVBZ = ZERO
        self.FVB = ZERO
        self.FVBZSO = ZERO
        self.FVBSO = ZERO
        self.MRE4ALTE()

    def MRE4ALTE(self) -> None:
        self.ALTE = ZERO

    def MRE4ABZ(self) -> None:
        self.ZRE4 = round_down(
            self.ZRE4J - self.FVB - self.ALTE - self.JLFREIB + self.JLHINZU,
            2
        )

        if self.ZRE4 < ZERO:
            self.ZRE4 = ZERO

        self.ZRE4VP = self.ZRE4J

        self.ZVBEZ = round_down(self.ZVBEZJ - self.FVB, 2)

        if self.ZVBEZ < ZERO:
            self.ZVBEZ = ZERO

    def MBERECH(self) -> None:
        self.MZTABFB()
        self.VFRB = round_down((self.ANP + self.FVB + self.FVBZ) * ONE_HUNDRED, 0)

        self.MLSTJAHR()

        self.WVFRB = round_down((self.ZVE - self.GFB) * ONE_HUNDRED, 0)

        if self.WVFRB < ZERO:
            self.WVFRB = ZERO

        self.LSTJAHR = round_down(self.ST * self.f, 0)
        self.UPLSTLZZ()

        if self.ZKF > ZERO:
            self.ZTABFB = self.ZTABFB + self.KFB
            self.MRE4ABZ()
            self.MLSTJAHR()
            self.JBMG = round_down(self.ST * self.f, 0)
        else:
            self.JBMG = self.LSTJAHR

        self.MSOLZ()

    def MZTABFB(self) -> None:
        self.ANP = ZERO

        if self.ZVBEZ >= ZERO and self.ZVBEZ < self.FVBZ:
            self.FVBZ = Decimal(int(self.ZVBEZ))

        if self.STKL < 6:
            if self.ZVBEZ > ZERO:
                if self.ZVBEZ - self.FVBZ < d("102"):
                    self.ANP = round_up(self.ZVBEZ - self.FVBZ, 0)
                else:
                    self.ANP = d("102")
        else:
            self.FVBZ = ZERO
            self.FVBZSO = ZERO

        if self.STKL < 6:
            if self.ZRE4 > self.ZVBEZ:
                if self.ZRE4 - self.ZVBEZ < d("1230"):
                    self.ANP = round_up(self.ANP + self.ZRE4 - self.ZVBEZ, 0)
                else:
                    self.ANP = self.ANP + d("1230")

        self.KZTAB = 1

        if self.STKL == 1:
            self.SAP = d("36")
            self.KFB = round_down(self.ZKF * d("9756"), 0)
        elif self.STKL == 2:
            self.EFA = d("4260")
            self.SAP = d("36")
            self.KFB = round_down(self.ZKF * d("9756"), 0)
        elif self.STKL == 3:
            self.KZTAB = 2
            self.SAP = d("36")
            self.KFB = round_down(self.ZKF * d("9756"), 0)
        elif self.STKL == 4:
            self.SAP = d("36")
            self.KFB = round_down(self.ZKF * d("4878"), 0)
        elif self.STKL == 5:
            self.SAP = d("36")
            self.KFB = ZERO
        else:
            self.KFB = ZERO

        self.ZTABFB = round_down(self.EFA + self.ANP + self.SAP + self.FVBZ, 2)

    def MLSTJAHR(self) -> None:
        self.UPEVP()
        self.ZVE = self.ZRE4 - self.ZTABFB - self.VSP
        self.UPMLST()

    def UPLSTLZZ(self) -> None:
        self.JW = self.LSTJAHR * ONE_HUNDRED
        self.UPANTEIL()
        self.LSTLZZ = self.ANTEIL1

    def UPMLST(self) -> None:
        if self.ZVE < ONE:
            self.ZVE = ZERO
            self.X = ZERO
        else:
            self.X = round_down(self.ZVE / d(self.KZTAB), 0)

        if self.STKL < 5:
            self.UPTAB26()
        else:
            self.MST5_6()

    def UPEVP(self) -> None:
        if self.KRV == 1:
            self.VSPR = ZERO
        else:
            if self.ZRE4VP > self.BBGRVALV:
                self.ZRE4VPR = self.BBGRVALV
            else:
                self.ZRE4VPR = self.ZRE4VP

            self.VSPR = round_down(self.ZRE4VPR * self.RVSATZAN, 2)

        self.MVSPKVPV()

        if self.ALV != 1 and self.STKL != 6:
            self.MVSPHB()

    def MVSPKVPV(self) -> None:
        if self.ZRE4VP > self.BBGKVPV:
            self.ZRE4VPR = self.BBGKVPV
        else:
            self.ZRE4VPR = self.ZRE4VP

        if self.PKV > 0:
            if self.STKL == 6:
                self.VSPKVPV = ZERO
            else:
                self.PKPVAGZJ = round_down((self.PKPVAGZ * TWELVE) / ONE_HUNDRED, 2)
                self.VSPKVPV = round_down((self.PKPV * TWELVE) / ONE_HUNDRED, 2)
                self.VSPKVPV = self.VSPKVPV - self.PKPVAGZJ

                if self.VSPKVPV < ZERO:
                    self.VSPKVPV = ZERO
        else:
            self.VSPKVPV = round_down(
                self.ZRE4VPR * (self.KVSATZAN + self.PVSATZAN),
                2
            )

        self.VSP = round_up(self.VSPKVPV + self.VSPR, 0)

    def MVSPHB(self) -> None:
        if self.ZRE4VP > self.BBGRVALV:
            self.ZRE4VPR = self.BBGRVALV
        else:
            self.ZRE4VPR = self.ZRE4VP

        self.VSPALV = round_down(self.AVSATZAN * self.ZRE4VPR, 2)
        self.VSPHB = round_down(self.VSPALV + self.VSPKVPV, 2)

        if self.VSPHB > d("1900"):
            self.VSPHB = d("1900")

        self.VSPN = round_up(self.VSPR + self.VSPHB, 0)

        if self.VSPN > self.VSP:
            self.VSP = self.VSPN

    def MST5_6(self) -> None:
        self.ZZX = self.X

        if self.ZZX > self.W2STKL5:
            self.ZX = self.W2STKL5
            self.UP5_6()

            if self.ZZX > self.W3STKL5:
                self.ST = round_down(
                    self.ST + ((self.W3STKL5 - self.W2STKL5) * d("0.42")),
                    0
                )
                self.ST = round_down(
                    self.ST + ((self.ZZX - self.W3STKL5) * d("0.45")),
                    0
                )
            else:
                self.ST = round_down(
                    self.ST + ((self.ZZX - self.W2STKL5) * d("0.42")),
                    0
                )
        else:
            self.ZX = self.ZZX
            self.UP5_6()

            if self.ZZX > self.W1STKL5:
                self.VERGL = self.ST
                self.ZX = self.W1STKL5
                self.UP5_6()
                self.HOCH = round_down(
                    self.ST + ((self.ZZX - self.W1STKL5) * d("0.42")),
                    0
                )

                if self.HOCH < self.VERGL:
                    self.ST = self.HOCH
                else:
                    self.ST = self.VERGL

    def UP5_6(self) -> None:
        self.X = round_down(self.ZX * d("1.25"), 0)
        self.UPTAB26()
        self.ST1 = self.ST

        self.X = round_down(self.ZX * d("0.75"), 0)
        self.UPTAB26()
        self.ST2 = self.ST

        self.DIFF = (self.ST1 - self.ST2) * TWO
        self.MIST = round_down(self.ZX * d("0.14"), 0)

        if self.MIST > self.DIFF:
            self.ST = self.MIST
        else:
            self.ST = self.DIFF

    def MSOLZ(self) -> None:
        self.SOLZFREI = self.SOLZFREI * d(self.KZTAB)

        if self.JBMG > self.SOLZFREI:
            self.SOLZJ = round_down((self.JBMG * d("5.5")) / ONE_HUNDRED, 2)
            self.SOLZMIN = round_down(
                ((self.JBMG - self.SOLZFREI) * d("11.9")) / ONE_HUNDRED,
                2
            )

            if self.SOLZMIN < self.SOLZJ:
                self.SOLZJ = self.SOLZMIN

            self.JW = round_down(self.SOLZJ * ONE_HUNDRED, 0)
            self.UPANTEIL()
            self.SOLZLZZ = self.ANTEIL1
        else:
            self.SOLZLZZ = ZERO

        if self.R > 0:
            self.JW = self.JBMG * ONE_HUNDRED
            self.UPANTEIL()
            self.BK = self.ANTEIL1
        else:
            self.BK = ZERO

    def UPANTEIL(self) -> None:
        if self.LZZ == 1:
            self.ANTEIL1 = self.JW
        elif self.LZZ == 2:
            self.ANTEIL1 = round_down(self.JW / TWELVE, 0)
        elif self.LZZ == 3:
            self.ANTEIL1 = round_down((self.JW * SEVEN) / THREE_HUNDRED_SIXTY, 0)
        else:
            self.ANTEIL1 = round_down(self.JW / THREE_HUNDRED_SIXTY, 0)

    def MSONST(self) -> None:
        self.LZZ = 1

        if self.ZMVB == 0:
            self.ZMVB = 12

        if self.SONSTB == ZERO and self.MBV == ZERO:
            self.LSTSO = ZERO
            self.STS = ZERO
            self.SOLZS = ZERO
            self.BKS = ZERO
        else:
            raise NotImplementedError(
                "Les revenus exceptionnels ne sont pas encore activés dans le module FLCL."
            )

    def UPTAB26(self) -> None:
        if self.X < self.GFB + ONE:
            self.ST = ZERO
        elif self.X < d("17800"):
            self.Y = round_down((self.X - self.GFB) / TEN_THOUSAND, 6)
            self.RW = self.Y * d("914.51")
            self.RW = self.RW + d("1400")
            self.ST = round_down(self.RW * self.Y, 0)
        elif self.X < d("69879"):
            self.Y = round_down((self.X - d("17799")) / TEN_THOUSAND, 6)
            self.RW = self.Y * d("173.1")
            self.RW = self.RW + d("2397")
            self.RW = self.RW * self.Y
            self.ST = round_down(self.RW + d("1034.87"), 0)
        elif self.X < d("277826"):
            self.ST = round_down((self.X * d("0.42")) - d("11135.63"), 0)
        else:
            self.ST = round_down((self.X * d("0.45")) - d("19470.38"), 0)

        self.ST = self.ST * d(self.KZTAB)

    def result(self) -> dict:
        return {
            "lohnsteuer_monthly_eur": float(self.LSTLZZ / ONE_HUNDRED),
            "solidarity_surcharge_monthly_eur": float(self.SOLZLZZ / ONE_HUNDRED),
            "church_tax_base_monthly_eur": float(self.BK / ONE_HUNDRED),
            "lohnsteuer_annual_eur": float((self.LSTLZZ * TWELVE) / ONE_HUNDRED),
            "solidarity_surcharge_annual_eur": float((self.SOLZLZZ * TWELVE) / ONE_HUNDRED),
            "church_tax_base_annual_eur": float((self.BK * TWELVE) / ONE_HUNDRED),
        }


def compute_lohnsteuer_2026(
    gross_monthly_eur: float,
    steuerklasse: int = 1,
    additional_health_rate_percent: float = 2.9,
    saxony: bool = False,
    childless: bool = False,
    child_allowances: float = 0.0,
    church_tax: bool = False,
) -> dict:
    pap = Pap2026Lohnsteuer(
        gross_monthly_eur=gross_monthly_eur,
        steuerklasse=steuerklasse,
        additional_health_rate_percent=additional_health_rate_percent,
        saxony=saxony,
        childless=childless,
        child_allowances=child_allowances,
        church_tax=church_tax,
    )

    pap.main()

    return pap.result()


if __name__ == "__main__":
    for wage in [2409.33, 3000, 5000, 7000, 10000]:
        result = compute_lohnsteuer_2026(
            gross_monthly_eur=wage,
            steuerklasse=1,
            additional_health_rate_percent=2.9,
            saxony=False,
            childless=False,
            church_tax=False,
        )

        print()
        print(f"Gross monthly: {wage:.2f} €")
        print(f"Lohnsteuer: {result['lohnsteuer_monthly_eur']:.2f} €")
        print(f"Solidarity surcharge: {result['solidarity_surcharge_monthly_eur']:.2f} €")
        print(f"Church tax base: {result['church_tax_base_monthly_eur']:.2f} €")