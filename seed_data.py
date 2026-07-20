"""Demo data seeding for Kirana Konnect.

Provides an idempotent seeder that fills the store with a realistic Indian
kirana catalog (110+ products across 18 categories), a set of customers, and
two weeks of billing history so every screen (dashboard, sales report, udhar
ledger, low-stock, expiry alerts) has meaningful data.

Products are matched by name and customers by phone, so running the seeder
repeatedly never duplicates data.
"""

import random
from datetime import datetime, timedelta, date

# (name, category, price, cost_price, is_weight_based, stock, reorder_level, expiry_days)
# expiry_days: days from today; None = no expiry; negative = already expired.
CATALOG = [
    # Grains & Flour (weight-based, per kg)
    ("Aashirvaad Whole Wheat Atta", "grains", 48, 42, True, 80, 20, 240),
    ("Fortune Chakki Fresh Atta", "grains", 45, 39, True, 60, 20, 240),
    ("Rajdhani Besan", "grains", 95, 82, True, 25, 8, 180),
    ("Sooji Rava", "grains", 52, 44, True, 30, 10, 200),
    ("Maida All Purpose Flour", "grains", 44, 37, True, 35, 10, 200),
    ("Poha Thick", "grains", 60, 50, True, 20, 8, 150),
    ("Daliya Broken Wheat", "grains", 55, 46, True, 15, 6, 200),
    ("Murmura Puffed Rice", "grains", 70, 58, True, 12, 5, 120),
    # Rice (weight-based)
    ("India Gate Basmati Rice", "rice", 145, 122, True, 50, 15, 540),
    ("Daawat Rozana Basmati", "rice", 98, 84, True, 40, 12, 540),
    ("Sona Masoori Rice", "rice", 62, 52, True, 100, 25, 365),
    ("Kolam Rice", "rice", 55, 47, True, 80, 20, 365),
    ("Idli Rice", "rice", 58, 49, True, 30, 10, 365),
    ("Brown Rice", "rice", 85, 72, True, 15, 6, 300),
    # Pulses (weight-based)
    ("Toor Dal Unpolished", "pulses", 155, 132, True, 45, 12, 300),
    ("Moong Dal Yellow", "pulses", 125, 106, True, 35, 10, 300),
    ("Chana Dal", "pulses", 92, 78, True, 40, 12, 300),
    ("Masoor Dal", "pulses", 98, 83, True, 30, 10, 300),
    ("Urad Dal Gota", "pulses", 135, 115, True, 25, 8, 300),
    ("Kabuli Chana", "pulses", 140, 118, True, 20, 8, 300),
    ("Kala Chana", "pulses", 88, 74, True, 25, 8, 300),
    ("Rajma Chitra", "pulses", 148, 126, True, 18, 6, 300),
    ("Green Moong Whole", "pulses", 118, 100, True, 22, 8, 300),
    # Oils & Ghee (unit-based bottles/pouches)
    ("Fortune Sunflower Oil 1L", "oils", 152, 138, False, 40, 12, 300),
    ("Saffola Gold Oil 1L", "oils", 195, 176, False, 25, 8, 300),
    ("Fortune Kachi Ghani Mustard Oil 1L", "oils", 165, 148, False, 30, 10, 300),
    ("Dhara Groundnut Oil 1L", "oils", 210, 189, False, 15, 6, 300),
    ("Amul Pure Ghee 500ml", "oils", 305, 278, False, 20, 8, 270),
    ("Patanjali Cow Ghee 1L", "oils", 585, 540, False, 10, 4, 270),
    ("Idhayam Sesame Oil 500ml", "oils", 175, 158, False, 12, 5, 300),
    ("Coconut Oil Parachute 500ml", "oils", 182, 165, False, 18, 6, 400),
    # Spices (weight-based + packets)
    ("Haldi Powder Loose", "spices", 240, 200, True, 8, 3, 365),
    ("Lal Mirch Powder Loose", "spices", 320, 270, True, 6, 3, 365),
    ("Dhania Powder Loose", "spices", 210, 175, True, 7, 3, 365),
    ("Jeera Whole", "spices", 520, 450, True, 5, 2, 365),
    ("Rai Mustard Seeds", "spices", 120, 98, True, 6, 2, 365),
    ("MDH Deggi Mirch 100g", "spices", 78, 66, False, 24, 8, 540),
    ("Everest Garam Masala 100g", "spices", 82, 70, False, 30, 10, 540),
    ("MDH Chana Masala 100g", "spices", 72, 61, False, 20, 8, 540),
    ("Catch Chat Masala 100g", "spices", 68, 57, False, 18, 6, 540),
    ("Elaichi Green 50g", "spices", 190, 165, False, 10, 4, 365),
    ("Kali Mirch Whole 100g", "spices", 145, 124, False, 12, 4, 365),
    # Sugar, Salt & Sweeteners
    ("Sugar Loose", "grocery", 44, 40, True, 90, 25, None),
    ("Tata Salt 1kg", "grocery", 28, 24, False, 60, 20, 540),
    ("Saindha Namak Rock Salt 1kg", "grocery", 55, 46, False, 15, 5, None),
    ("Madhur Jaggery Gud", "grocery", 65, 54, True, 20, 8, 180),
    ("Dabur Honey 250g", "grocery", 135, 118, False, 14, 5, 540),
    # Tea & Coffee
    ("Tata Tea Gold 500g", "beverages", 285, 255, False, 22, 8, 365),
    ("Red Label Tea 500g", "beverages", 260, 234, False, 25, 8, 365),
    ("Wagh Bakri Tea 500g", "beverages", 275, 246, False, 15, 6, 365),
    ("Nescafe Classic 50g", "beverages", 165, 148, False, 18, 6, 540),
    ("Bru Instant Coffee 100g", "beverages", 240, 216, False, 12, 5, 540),
    # Beverages
    ("Coca Cola 750ml", "beverages", 40, 34, False, 48, 15, 120),
    ("Thums Up 750ml", "beverages", 40, 34, False, 40, 15, 120),
    ("Frooti Mango 1L", "beverages", 65, 56, False, 30, 10, 90),
    ("Real Mixed Fruit Juice 1L", "beverages", 110, 96, False, 20, 8, 90),
    ("Bisleri Water 1L", "beverages", 20, 16, False, 60, 20, 180),
    ("Rasna Orange Pack", "beverages", 55, 46, False, 25, 8, 365),
    ("Glucon-D Original 500g", "beverages", 145, 128, False, 15, 6, 540),
    # Snacks & Biscuits
    ("Parle-G Gold 100g", "snacks", 10, 8.2, False, 120, 30, 150),
    ("Britannia Good Day Cashew", "snacks", 35, 29, False, 60, 20, 150),
    ("Britannia Marie Gold", "snacks", 30, 25, False, 55, 18, 150),
    ("Oreo Chocolate Biscuit", "snacks", 30, 25, False, 45, 15, 150),
    ("Hide & Seek Fab", "snacks", 30, 25, False, 40, 15, 150),
    ("Lays Classic Salted", "snacks", 20, 16.5, False, 70, 25, 90),
    ("Kurkure Masala Munch", "snacks", 20, 16.5, False, 65, 25, 90),
    ("Haldiram Bhujia 200g", "snacks", 55, 47, False, 35, 12, 120),
    ("Haldiram Moong Dal 200g", "snacks", 52, 44, False, 30, 10, 120),
    ("Bingo Mad Angles", "snacks", 20, 16.5, False, 40, 15, 90),
    ("Unibic Butter Cookies", "snacks", 40, 34, False, 25, 8, 150),
    ("Namkeen Mixture Loose", "snacks", 240, 200, True, 10, 4, 60),
    # Dairy & Bakery
    ("Amul Butter 100g", "dairy", 60, 54, False, 24, 8, 90),
    ("Amul Cheese Slices 100g", "dairy", 95, 85, False, 15, 6, 60),
    ("Amul Fresh Milk 500ml", "dairy", 29, 26, False, 40, 15, 3),
    ("Mother Dairy Dahi 400g", "dairy", 40, 35, False, 20, 8, 7),
    ("Amul Masti Buttermilk 500ml", "dairy", 18, 15, False, 25, 10, 5),
    ("Britannia Bread Large", "dairy", 30, 25, False, 22, 10, 4),
    ("Britannia Fruit Cake", "dairy", 35, 29, False, 15, 6, 30),
    ("Paneer Fresh 200g", "dairy", 85, 74, False, 10, 4, 3),
    # Instant Food
    ("Maggi 2-Minute Noodles", "instant", 14, 11.8, False, 100, 30, 240),
    ("Yippee Noodles", "instant", 14, 11.8, False, 60, 20, 240),
    ("Top Ramen Curry", "instant", 15, 12.5, False, 40, 15, 240),
    ("MTR Rava Idli Mix 500g", "instant", 98, 85, False, 15, 6, 270),
    ("Gits Gulab Jamun Mix", "instant", 105, 92, False, 12, 5, 365),
    ("Knorr Tomato Soup", "instant", 60, 51, False, 15, 6, 365),
    ("Pasta Macaroni 500g", "instant", 55, 46, False, 20, 8, 365),
    # Personal Care
    ("Lifebuoy Soap 100g", "personal_care", 32, 27, False, 60, 20, 540),
    ("Lux Soap 100g", "personal_care", 34, 29, False, 50, 18, 540),
    ("Dettol Original Soap 100g", "personal_care", 38, 33, False, 45, 15, 540),
    ("Colgate Strong Teeth 200g", "personal_care", 108, 95, False, 30, 10, 540),
    ("Close Up Red 150g", "personal_care", 92, 81, False, 25, 8, 540),
    ("Clinic Plus Shampoo 340ml", "personal_care", 210, 188, False, 15, 6, 540),
    ("Head & Shoulders Sachet", "personal_care", 3, 2.4, False, 200, 50, 540),
    ("Fair & Lovely 50g", "personal_care", 125, 110, False, 12, 5, 540),
    ("Vaseline Petroleum Jelly 85g", "personal_care", 95, 83, False, 15, 6, 720),
    ("Gillette Presto Razor", "personal_care", 25, 20.5, False, 30, 10, None),
    ("Whisper Ultra Clean XL 15s", "personal_care", 165, 146, False, 20, 8, 720),
    ("Himalaya Baby Powder 100g", "personal_care", 85, 74, False, 10, 4, 540),
    # Household & Cleaning
    ("Surf Excel Easy Wash 1kg", "household", 135, 120, False, 30, 10, 720),
    ("Ariel Matic 1kg", "household", 210, 189, False, 20, 8, 720),
    ("Rin Detergent Bar 250g", "household", 32, 27, False, 40, 15, 720),
    ("Vim Dishwash Bar 300g", "household", 30, 25, False, 50, 18, 720),
    ("Vim Liquid Gel 500ml", "household", 115, 101, False, 18, 6, 720),
    ("Harpic Toilet Cleaner 500ml", "household", 98, 86, False, 20, 8, 720),
    ("Lizol Floor Cleaner 975ml", "household", 189, 168, False, 15, 6, 720),
    ("Colin Glass Cleaner 500ml", "household", 92, 80, False, 12, 5, 720),
    ("Good Knight Refill", "household", 85, 74, False, 25, 10, 540),
    ("All Out Refill", "household", 82, 71, False, 22, 8, 540),
    ("Odonil Air Freshener", "household", 55, 46, False, 15, 6, 540),
    ("Garbage Bags Medium 30s", "household", 65, 53, False, 20, 8, None),
    ("Scotch Brite Scrub Pad", "household", 20, 16, False, 35, 12, None),
    ("Matchbox Homelites Pack of 10", "household", 20, 16.5, False, 40, 15, None),
    ("Camphor Tablets 50g", "pooja", 60, 50, False, 20, 8, None),
    ("Agarbatti Mogra Pack", "pooja", 35, 28, False, 30, 10, 365),
    ("Pooja Oil 500ml", "pooja", 95, 82, False, 12, 5, 365),
    ("Cotton Wicks Pack", "pooja", 15, 11.5, False, 25, 8, None),
    # Stationery & Misc
    ("Classmate Notebook 172p", "stationery", 55, 46, False, 30, 10, None),
    ("Reynolds Pen Blue", "stationery", 10, 7.8, False, 60, 20, None),
    ("Fevistick 15g", "stationery", 35, 29, False, 20, 8, None),
    ("Cello Tape Small", "stationery", 15, 11.5, False, 25, 8, None),
    # Medical basics
    ("Paracetamol 500mg Strip", "medical", 25, 20, False, 40, 15, 540),
    ("Band-Aid Pack of 10", "medical", 30, 25, False, 25, 8, 720),
    ("Dettol Antiseptic 125ml", "medical", 85, 74, False, 18, 6, 720),
    ("Vicks VapoRub 25ml", "medical", 95, 83, False, 15, 6, 720),
    ("Electral Powder Sachet", "medical", 22, 18, False, 30, 10, 540),
    # A few items already expired / expiring now, to exercise the alert screens
    ("Amul Kool Badam 200ml", "dairy", 30, 26, False, 8, 5, -3),
    ("Curd Pouch 200g", "dairy", 15, 12.5, False, 6, 4, -1),
    ("Fresh Cream Amul 250ml", "dairy", 55, 48, False, 5, 3, 2),
    ("Bourbon Biscuit Old Stock", "snacks", 25, 21, False, 4, 6, 5),
]

CUSTOMERS = [
    ("Ramesh Gupta", "9812045671", "12 Gandhi Road, Sector 4"),
    ("Sunita Sharma", "9823156782", "Flat 302, Shanti Apartments"),
    ("Abdul Karim", "9834267893", "45 Station Road"),
    ("Lakshmi Iyer", "9845378904", "8 Temple Street"),
    ("Harpreet Singh", "9856489015", "22 Model Town"),
    ("Meena Patel", "9867590126", "Ward 7, Near Bus Stand"),
    ("Joseph D'Souza", "9878601237", "St. Mary's Colony, House 14"),
    ("Kavita Yadav", "9889712348", "Behind Civil Hospital"),
    ("Prakash Rao", "9890823459", "MG Road, Shop Line"),
    ("Fatima Begum", "9901934560", "Idgah Mohalla, Lane 3"),
    ("Dinesh Kumar", "9912045678", "Village Rampur, Post Khera"),
    ("Anita Desai", "9923156789", "Sunview Society, B-Wing"),
]


def _barcode_for(index):
    """Deterministic pseudo-EAN13 with the India '890' prefix."""
    body = f"890{(1030870000 + index * 7) % 10**10:010d}"
    return body[:13]


STAFF = [
    ("Anil Kumar", "Cashier", "9700011122"),
    ("Priya Singh", "Manager", "9700033344"),
    ("Sonu Yadav", "Helper", "9700055566"),
]


def seed_demo(db, Product, Customer, Bill, BillItem, Payment, Staff=None, with_history=True):
    """Idempotently seed products, customers and (optionally) billing history.

    Returns a dict of counts describing what was added.
    """
    today = date.today()
    now = datetime.utcnow()
    added = {"products": 0, "customers": 0, "bills": 0, "payments": 0, "staff": 0}

    if Staff is not None:
        existing_staff = {n for (n,) in db.session.query(Staff.name).all()}
        for name, role, phone in STAFF:
            if name not in existing_staff:
                db.session.add(Staff(name=name, role=role, phone=phone))
                added["staff"] += 1

    existing_names = {n for (n,) in db.session.query(Product.name).all()}
    for i, (name, category, price, cost, weight_based, stock, reorder, exp_days) in enumerate(CATALOG):
        if name in existing_names:
            continue
        db.session.add(Product(
            name=name,
            category=category,
            barcode=_barcode_for(i),
            price=price,
            cost_price=cost,
            price_per_kg=price if weight_based else None,
            is_weight_based=weight_based,
            stock_quantity=stock,
            reorder_level=reorder,
            expiry_date=(today + timedelta(days=exp_days)) if exp_days is not None else None,
        ))
        added["products"] += 1

    existing_phones = {p for (p,) in db.session.query(Customer.phone).all()}
    customers = []
    for name, phone, address in CUSTOMERS:
        if phone in existing_phones:
            customers.append(Customer.query.filter_by(phone=phone).first())
            continue
        c = Customer(name=name, phone=phone, address=address)
        db.session.add(c)
        customers.append(c)
        added["customers"] += 1
    db.session.flush()

    if with_history and db.session.query(Bill.id).count() < 10:
        rng = random.Random(42)  # deterministic history
        products = Product.query.all()
        bill_no = 1
        for days_ago in range(14, 0, -1):
            day = now - timedelta(days=days_ago)
            for _ in range(rng.randint(2, 5)):
                items = rng.sample(products, rng.randint(1, 4))
                subtotal = 0.0
                bill_items = []
                for p in items:
                    qty = round(rng.uniform(0.5, 2.0), 1) if p.is_weight_based else rng.randint(1, 4)
                    line = round(qty * p.price, 2)
                    subtotal += line
                    bill_items.append((p, qty, line))
                mode = rng.choices(["cash", "online", "credit"], weights=[60, 25, 15])[0]
                customer = rng.choice(customers) if (mode == "credit" or rng.random() < 0.4) else None
                bill = Bill(
                    bill_number=f"KK-{day.year}-{5000 + bill_no}",
                    customer_id=customer.id if customer else None,
                    customer_name=customer.name if customer else "Walk-in Customer",
                    subtotal=round(subtotal, 2),
                    tax_amount=0,
                    discount_amount=0,
                    total_amount=round(subtotal, 2),
                    payment_mode=mode,
                    payment_status="pending" if mode == "credit" else "paid",
                    generated_by="Owner",
                    created_at=day.replace(hour=rng.randint(8, 21), minute=rng.randint(0, 59)),
                )
                db.session.add(bill)
                db.session.flush()
                for p, qty, line in bill_items:
                    db.session.add(BillItem(
                        bill_id=bill.id, item_name=p.name, quantity=qty,
                        unit_price=p.price, total_price=line,
                        weight=qty if p.is_weight_based else None,
                        price_per_kg=p.price_per_kg,
                    ))
                if mode != "credit" and customer:
                    db.session.add(Payment(
                        customer_id=customer.id, bill_id=bill.id,
                        amount=bill.total_amount, payment_mode=mode,
                        created_at=bill.created_at,
                    ))
                    added["payments"] += 1
                bill_no += 1
                added["bills"] += 1
        # A few partial repayments against credit so the udhar ledger shows movement
        for customer in customers[:4]:
            if customer.outstanding_balance > 100:
                db.session.add(Payment(
                    customer_id=customer.id, amount=round(customer.outstanding_balance * 0.4, 0),
                    payment_mode="cash", created_at=now - timedelta(days=2),
                ))
                added["payments"] += 1

    db.session.commit()
    return added
